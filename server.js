import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { generateReport, generateShareQuote } from './lib/analyzer.js';
import { newShortCode, normalizeShortCode } from './lib/shortcode.js';
import { rateLimit } from './lib/rateLimit.js';
import { createUserStore } from './lib/users.js';
import { createAuth, COOKIE_NAME, cookieOptions } from './lib/auth.js';
import { createInviteStore } from './lib/invites.js';
import { createUsageStore } from './lib/usage.js';
import { createCreditStore } from './lib/credits.js';
import { createOrderStore, PRICE_PER_ANALYSIS_FEN } from './lib/orders.js';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 带 Cookie 的跨域请求必须指定具体来源，不能用 *
app.use(
  cors({
    origin: (origin, cb) => cb(null, origin || true),
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

/**
 * 数据目录
 *
 * 默认写在项目下的 data/，但项目若放在 /tmp 等临时目录会随重启丢失。
 * 通过 DATA_DIR 环境变量可指向任意持久化位置（如挂载卷、用户目录）。
 */
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');

const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/* --------------------------------- 工具函数 --------------------------------- */

// 内部目录名仍用长随机串
function newSessionId() {
  return `session_${crypto.randomBytes(12).toString('hex')}`;
}

// 防路径穿越：只允许我们自己生成的格式
function isValidSessionId(id) {
  return typeof id === 'string' && /^session_[a-f0-9]{24}$/.test(id);
}

function sessionPathOf(sessionId) {
  return path.join(SESSIONS_DIR, sessionId);
}

/* ------------------------------ 短码 ←→ 会话映射 ------------------------------ */

const CODES_FILE = path.join(DATA_DIR, 'codes.json');

/* ------------------------------- 用户与鉴权初始化 ------------------------------ */

const users = createUserStore(DATA_DIR);
const invites = createInviteStore(DATA_DIR);
const usage = createUsageStore(DATA_DIR, {
  dailyAnalyses: Number(process.env.DAILY_ANALYSIS_LIMIT || 3),
  maxStorageBytes: Number(process.env.MAX_STORAGE_MB || 100) * 1024 * 1024
});
const credits = createCreditStore(DATA_DIR);
const orders = createOrderStore(DATA_DIR);

// 邀请奖励：每成功邀请 1 人，奖励多少次分析
const INVITE_REWARD = Number(process.env.INVITE_REWARD || 5);
// 每人每天可领取的邀请码数量
const DAILY_INVITE_CODES = Number(process.env.DAILY_INVITE_CODES || 3);

// 是否需要邀请码才能注册（首个管理员账号除外）
const REQUIRE_INVITE = String(process.env.REQUIRE_INVITE ?? 'true') !== 'false';

// 会话密钥：优先读环境变量，否则生成并持久化，避免重启后所有人被登出
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');
function loadSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, 'utf-8').trim();

  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, secret, { encoding: 'utf-8', mode: 0o600 });
  return secret;
}

const auth = createAuth({ secret: loadSessionSecret() });

function readCodes() {
  if (!fs.existsSync(CODES_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeCodes(codes) {
  fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
}

// 生成一个未被占用的短码
function allocateShortCode(sessionId) {
  const codes = readCodes();
  let code;
  do {
    code = newShortCode();
  } while (codes[code]);

  codes[code] = sessionId;
  writeCodes(codes);
  return code;
}

/**
 * 把用户输入解析成内部 sessionId。
 * 同时接受短码（K7F2-Q9WM）和完整 sessionId（兼容旧链接）。
 */
function resolveToSessionId(input) {
  if (isValidSessionId(input)) return input;

  const code = normalizeShortCode(input);
  if (!code) return null;

  return readCodes()[code] || null;
}

/* ---------------------------------- 上传配置 --------------------------------- */

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = newSessionId();
    const sessionPath = sessionPathOf(sessionId);
    fs.mkdirSync(sessionPath, { recursive: true });
    req.sessionId = sessionId;
    req.sessionPath = sessionPath;
    cb(null, sessionPath);
  },
  filename: (req, file, cb) => {
    cb(null, `drawing${EXT_BY_MIME[file.mimetype] || '.png'}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('只支持 PNG / JPG / WEBP / GIF 格式的图片'));
    }
    cb(null, true);
  }
});


/* ------------------------------------ 鉴权 ----------------------------------- */

app.use(auth.attachUser);

const authLimiter = rateLimit({
  scope: 'auth',
  windowMs: 600_000,
  max: 20,
  message: '尝试过于频繁，请十分钟后再试'
});

/**
 * 注册。
 * 首个注册的账号自动成为管理员（超级管理员由部署者先注册）。
 */
app.post('/api/auth/register', authLimiter, (req, res) => {
  const { username, password, inviteCode } = req.body || {};

  const isFirst = users.count() === 0;

  // 首个账号是部署者本人，不需要邀请码；之后一律需要
  let invite = null;
  if (!isFirst && REQUIRE_INVITE) {
    const result = invites.check(inviteCode);
    if (!result.ok) {
      return res.status(403).json({ error: result.reason, needInvite: true });
    }
    invite = result.code;
  }

  try {
    const user = users.create({
      username,
      password,
      role: isFirst ? 'admin' : 'user'
    });

    if (invite) {
      invites.consume(invite, { userId: user.id, username: user.username });

      // 邀请奖励发给码的持有者（管理员发的通用码没有持有者，不发奖励）
      const inviterId = invites.ownerOf(invite);
      if (inviterId && inviterId !== user.id) {
        credits.add(inviterId, INVITE_REWARD, 'invite_reward', {
          inviteCode: invite,
          inviteeId: user.id,
          inviteeName: user.username
        });
        console.log(`[Server] 邀请奖励：${inviterId} +${INVITE_REWARD} 次（邀请 ${user.username}）`);
      }
    }

    const token = auth.issueToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions(req));
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body || {};

  const user = users.verify(username, password);
  if (!user) {
    // 不区分"用户不存在"和"密码错误"，避免用户名枚举
    return res.status(401).json({ error: '用户名或密码不正确' });
  }

  const token = auth.issueToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions(req));
  return res.json({ user, token });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({
      user: null,
      needsSetup: users.count() === 0,
      requireInvite: REQUIRE_INVITE
    });
  }
  return res.json({
    user: {
      id: req.user.sub,
      username: req.user.username,
      role: req.user.role
    },
    quota: usage.get(req.user.sub),
    credits: credits.balance(req.user.sub),
    requireInvite: REQUIRE_INVITE
  });
});

/* ----------------------------------- 限流 ----------------------------------- */

// 报告查询：防止短码被暴力枚举
// 正常使用中，前端每 3 秒轮询一次（约 20 次/分钟），因此上限需留出余量
const reportLimiter = rateLimit({
  scope: 'report',
  windowMs: 60_000,
  max: 60,
  message: '查询过于频繁，请稍后再试'
});

// 提交分析：每次都会调用大模型，限制更严
const submitLimiter = rateLimit({
  scope: 'submit',
  windowMs: 600_000,
  max: 10,
  message: '提交过于频繁，请十分钟后再试'
});

/* ------------------------------------ 路由 ----------------------------------- */

/**
 * 提交画作与问卷。
 * 保存 answers.json 后立即返回 sessionId，AI 分析在后台异步进行，
 * 前端通过轮询 /api/report/:sessionId 获取结果。
 */
/**
 * 配额预检：在 multer 落盘之前拦截，避免超额请求仍然写入文件。
 */
function checkQuota(req, res, next) {
  const incoming = Number(req.headers['content-length'] || 0);
  const isAdmin = req.user.role === 'admin';

  const verdict = usage.canAnalyze(req.user.sub, { isAdmin, incomingBytes: incoming });

  if (verdict.ok) {
    req.useCredit = false;
    return next();
  }

  // 存储超限无法用积分抵扣
  if (verdict.code === 'STORAGE_LIMIT') {
    return res.status(429).json({ error: verdict.message, code: verdict.code });
  }

  // 免费次数用完 → 尝试用积分
  const balance = credits.balance(req.user.sub);
  if (balance >= 1) {
    req.useCredit = true;
    return next();
  }

  return res.status(402).json({
    error: '今日免费次数已用完',
    code: 'NEED_CREDIT',
    balance: 0,
    pricePerAnalysisFen: PRICE_PER_ANALYSIS_FEN,
    hint: '可以购买次数，或邀请朋友获得免费次数'
  });
}

app.post(
  '/api/submit',
  auth.requireAuth,
  submitLimiter,
  checkQuota,
  upload.single('drawing'),
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有收到画作文件' });
    }

    const { drawingTitle, description, emotions, dialogue, backgroundContext } = req.body;

    if (!description?.trim() || !emotions?.trim()) {
      return res.status(400).json({ error: '画面描述和情绪感受为必填项' });
    }

    const answers = {
      sessionId: req.sessionId,
      shortCode: allocateShortCode(req.sessionId),
      ownerId: req.user.sub,
      ownerName: req.user.username,
      timestamp: new Date().toISOString(),
      drawingTitle: drawingTitle || '',
      description: description || '',
      emotions: emotions || '',
      dialogue: dialogue || '',
      backgroundContext: backgroundContext || '',
      filename: req.file.filename,
      relativeImagePath: `data/sessions/${req.sessionId}/${req.file.filename}`
    };

    fs.writeFileSync(
      path.join(req.sessionPath, 'answers.json'),
      JSON.stringify(answers, null, 2),
      'utf-8'
    );

    let creditBalance = credits.balance(req.user.sub);
    if (req.useCredit) {
      credits.spendOne(req.user.sub, { sessionId: req.sessionId });
      creditBalance -= 1;
      // 积分消费也计入存储用量，但不占当日免费次数
      usage.recordStorageOnly(req.user.sub, req.file.size || 0);
    }
    const quota = req.useCredit
      ? usage.get(req.user.sub)
      : usage.record(req.user.sub, req.file.size || 0);

    console.log(
      `[Server] 会话 ${req.sessionId} 数据已保存（短码 ${answers.shortCode}，` +
        `${req.user.username} 今日 ${quota.usedToday}/${quota.dailyLimit}）`
    );

    // 先响应，让用户看到成功页，分析在后台跑
    res.status(200).json({
      success: true,
      message: '数据已保存，分析报告正在生成中',
      sessionId: req.sessionId,
      shortCode: answers.shortCode,
      quota: {
        usedToday: quota.usedToday,
        remainingToday: quota.remainingToday,
        dailyLimit: quota.dailyLimit,
        credits: creditBalance,
        usedCredit: Boolean(req.useCredit)
      }
    });

    runAnalysis(req.sessionId, answers, path.join(req.sessionPath, req.file.filename));
  } catch (error) {
    console.error('[Server Error] 提交失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
  }
);

/**
 * 后台执行分析，结果写入 report.json；失败则写 error.json 供前端展示
 */
async function runAnalysis(sessionId, answers, imagePath) {
  const dir = sessionPathOf(sessionId);
  const statusPath = path.join(dir, 'status.json');

  const writeStatus = (state, message) =>
    fs.writeFileSync(
      statusPath,
      JSON.stringify({ state, message: message || '', updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );

  writeStatus('analyzing', '正在生成分析报告');

  try {
    console.log(`[Analyzer] 开始分析 ${sessionId} …`);
    const report = await generateReport(answers, imagePath);

    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2), 'utf-8');
    writeStatus('done', '');
    console.log(`[Analyzer] ${sessionId} 分析完成`);
  } catch (err) {
    console.error(`[Analyzer] ${sessionId} 分析失败:`, err.message);
    writeStatus('failed', err.message);
  }
}


/**
 * 归属校验：普通用户只能访问自己的会话，管理员可访问全部。
 *
 * 历史数据（引入登录前生成的）没有 ownerId，仅管理员可见，
 * 避免旧报告对所有登录用户暴露。
 */
function loadOwnedSession(req, res, next) {
  const sessionId = resolveToSessionId(req.params.sessionId);
  if (!sessionId) {
    return res.status(400).json({ error: '查询码格式不正确，请检查输入' });
  }

  const dir = sessionPathOf(sessionId);
  const answersPath = path.join(dir, 'answers.json');
  if (!fs.existsSync(dir) || !fs.existsSync(answersPath)) {
    return res.status(404).json({ error: '查询码不存在，请检查输入是否正确' });
  }

  const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
  const isAdmin = req.user.role === 'admin';
  const isOwner = answers.ownerId && answers.ownerId === req.user.sub;

  if (!isAdmin && !isOwner) {
    // 用 404 而非 403，避免泄露"这个码确实存在"
    return res.status(404).json({ error: '查询码不存在，请检查输入是否正确' });
  }

  req.sessionIdResolved = sessionId;
  req.sessionAnswers = answers;
  next();
}

/**
 * 手动重新生成报告（分析失败时可重试）
 */
app.post(
  '/api/report/:sessionId/regenerate',
  auth.requireAuth,
  reportLimiter,
  loadOwnedSession,
  async (req, res) => {
  const sessionId = req.sessionIdResolved;
  const answers = req.sessionAnswers;
  const imagePath = path.join(sessionPathOf(sessionId), answers.filename);

  res.status(202).json({ success: true, message: '已重新开始分析', sessionId });
  runAnalysis(sessionId, answers, imagePath);
  }
);

/**
 * 获取报告。返回 status 字段供前端轮询：
 *   analyzing / done / failed / pending
 */
app.get(
  '/api/report/:sessionId',
  auth.requireAuth,
  reportLimiter,
  loadOwnedSession,
  (req, res) => {
    const sessionId = req.sessionIdResolved;
    const answers = req.sessionAnswers;

    const dir = sessionPathOf(sessionId);
    const reportPath = path.join(dir, 'report.json');
    const statusPath = path.join(dir, 'status.json');

    const result = {
      sessionId,
      shortCode: answers.shortCode || null,
      hasAnswers: true,
      hasReport: fs.existsSync(reportPath),
      answers,
      report: null,
      status: 'pending',
      statusMessage: '',
      // 管理员查看他人报告时前端做出标识
      viewingAsAdmin: req.user.role === 'admin' && answers.ownerId !== req.user.sub
    };

    if (result.hasReport) {
      result.report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    }
    if (fs.existsSync(statusPath)) {
      const st = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      result.status = st.state;
      result.statusMessage = st.message;
    } else if (result.hasReport) {
      result.status = 'done';
    }

    return res.status(200).json(result);
  }
);

/**
 * 我的报告列表：服务端按 ownerId 过滤。
 * 管理员加 ?all=1 可查看全部用户的报告。
 */
app.get('/api/my-reports', auth.requireAuth, reportLimiter, (req, res) => {
  const wantAll = req.query.all === '1';
  if (wantAll && req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  const items = [];
  for (const id of fs.readdirSync(SESSIONS_DIR)) {
    const answersPath = path.join(SESSIONS_DIR, id, 'answers.json');
    if (!fs.existsSync(answersPath)) continue;

    let a;
    try {
      a = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
    } catch {
      continue;
    }

    if (!wantAll && a.ownerId !== req.user.sub) continue;
    // 见 DATA_PROTECTION.md：测试数据用标记隐藏，绝不删除
    if (a.isTestData && !wantAll) continue;

    const reportPath = path.join(SESSIONS_DIR, id, 'report.json');
    items.push({
      sessionId: id,
      shortCode: a.shortCode || null,
      title: a.drawingTitle || '未命名',
      timestamp: a.timestamp,
      hasReport: fs.existsSync(reportPath),
      ownerName: a.ownerName || null,
      ownerId: a.ownerId || null
    });
  }

  items.sort((x, y) => String(y.timestamp).localeCompare(String(x.timestamp)));
  return res.json({ items, isAdminView: wantAll });
});

/* ------------------------------- 管理员接口 -------------------------------- */




/**
 * 分享卡片素材：金句 + 从画作提取的配色
 *
 * 金句由模型现写并缓存到会话目录，重复请求不重复调用模型。
 * 配色只返回几个主色值，前端据此绘制抽象背景——
 * 这样卡片带有个人色彩，但不暴露画作内容。
 */
app.get('/api/report/:sessionId/share', auth.requireAuth, reportLimiter, loadOwnedSession, async (req, res) => {
  const sessionId = req.sessionIdResolved;
  const dir = sessionPathOf(sessionId);
  const reportPath = path.join(dir, 'report.json');

  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: '报告尚未生成' });
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const cachePath = path.join(dir, 'share.json');

  if (fs.existsSync(cachePath)) {
    return res.json(JSON.parse(fs.readFileSync(cachePath, 'utf-8')));
  }

  try {
    const { quote, question } = await generateShareQuote({
      drawingTitle: req.sessionAnswers.drawingTitle,
      report
    });

    const payload = {
      quote,
      question: question || '',
      drawingTitle: req.sessionAnswers.drawingTitle || '',
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json(payload);
  } catch (err) {
    console.error('[Share] 金句生成失败:', err.message);
    return res.status(503).json({ error: err.friendly || '金句生成失败，请稍后重试' });
  }
});

/* ------------------------------ 积分 / 邀请 / 订单 ----------------------------- */

/** 我的账户：余额、流水、每日邀请码、邀请战绩 */
app.get('/api/me/account', auth.requireAuth, (req, res) => {
  const uid = req.user.sub;
  const codes = invites.dailyCodesFor(uid, req.user.username, DAILY_INVITE_CODES);

  return res.json({
    quota: usage.get(uid),
    credits: credits.balance(uid),
    ledger: credits.ledger(uid, 20),
    inviteCodes: codes.map((c) => ({
      code: c.code,
      used: c.usedCount > 0,
      usedBy: c.usedBy[0]?.username || null
    })),
    inviteStats: invites.inviteStats(uid),
    inviteReward: INVITE_REWARD,
    pricePerAnalysisFen: PRICE_PER_ANALYSIS_FEN,
    shareUrl: process.env.PUBLIC_URL || ''
  });
});

/** 下单购买次数 */
app.post('/api/orders', auth.requireAuth, (req, res) => {
  const order = orders.create({
    userId: req.user.sub,
    username: req.user.username,
    quantity: req.body?.quantity
  });

  // 支付网关尚未接入：mock 模式下返回一个待确认订单，
  // 生产环境应在此处调起微信/支付宝下单接口并返回支付参数
  return res.status(201).json({
    order,
    payment: {
      provider: order.provider,
      ready: order.provider !== 'mock',
      message:
        order.provider === 'mock'
          ? '支付网关尚未接入，请联系管理员手动确认订单'
          : undefined
    }
  });
});

app.get('/api/orders', auth.requireAuth, (req, res) => {
  return res.json({ orders: orders.listByUser(req.user.sub) });
});

/** 管理员手动确认订单（支付网关接入前的过渡方案） */
app.post('/api/admin/orders/:id/confirm', auth.requireAdmin, (req, res) => {
  const order = orders.markPaid(req.params.id, { confirmedBy: req.user.username });
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.alreadyPaid) return res.json({ order, message: '该订单已确认过，未重复发放' });

  const balance = credits.add(order.userId, order.quantity, 'purchase', {
    orderId: order.id,
    totalFen: order.totalFen
  });

  console.log(`[Server] 订单 ${order.id} 已确认，${order.username} +${order.quantity} 次`);
  return res.json({ order, balance });
});

app.get('/api/admin/orders', auth.requireAdmin, (req, res) => {
  return res.json({ orders: orders.all() });
});

/** 管理员直接赠送次数 */
app.post('/api/admin/grant', auth.requireAdmin, (req, res) => {
  const { userId, amount, note } = req.body || {};
  const n = Number(amount);
  if (!userId || !Number.isFinite(n) || n === 0) {
    return res.status(400).json({ error: '参数不正确' });
  }
  const balance = credits.add(userId, n, 'admin_grant', { note: note || '', by: req.user.username });
  return res.json({ balance });
});

/* --------------------------- 管理员：邀请码与用量 --------------------------- */

app.get('/api/admin/invites', auth.requireAdmin, (req, res) => {
  return res.json({ invites: invites.list(), requireInvite: REQUIRE_INVITE });
});

app.post('/api/admin/invites', auth.requireAdmin, (req, res) => {
  const { note, maxUses, expiresInDays } = req.body || {};
  const inv = invites.create({
    note: String(note || '').slice(0, 100),
    maxUses,
    expiresInDays,
    createdBy: req.user.username
  });
  return res.status(201).json({ invite: inv });
});

app.post('/api/admin/invites/:code/revoke', auth.requireAdmin, (req, res) => {
  const ok = invites.revoke(req.params.code);
  return ok ? res.json({ success: true }) : res.status(404).json({ error: '邀请码不存在' });
});

app.post('/api/admin/invites/:code/restore', auth.requireAdmin, (req, res) => {
  const ok = invites.restore(req.params.code);
  return ok ? res.json({ success: true }) : res.status(404).json({ error: '邀请码不存在' });
});

app.get('/api/admin/usage', auth.requireAdmin, (req, res) => {
  const byUser = Object.fromEntries(usage.all().map((u) => [u.userId, u]));
  const list = users.list().map((u) => ({
    ...u,
    usage: byUser[u.id] || { usedToday: 0, totalAnalyses: 0, storageBytes: 0, lastAt: null }
  }));
  return res.json({ users: list, limits: usage.limits });
});

app.get('/api/admin/users', auth.requireAdmin, (req, res) => {
  const list = users.list();
  const counts = {};

  for (const id of fs.readdirSync(SESSIONS_DIR)) {
    const p = path.join(SESSIONS_DIR, id, 'answers.json');
    if (!fs.existsSync(p)) continue;
    try {
      const a = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (a.ownerId) counts[a.ownerId] = (counts[a.ownerId] || 0) + 1;
    } catch {
      /* 跳过损坏文件 */
    }
  }

  return res.json({
    users: list.map((u) => ({ ...u, reportCount: counts[u.id] || 0 }))
  });
});

/* ---------------------------------- 静态资源 --------------------------------- */

/**
 * 画作图片：必须登录，且只能取自己的（管理员除外）。
 * 不能用 express.static 直接挂，否则任何人拿到路径就能看到别人的画。
 *
 * 注意：res.sendFile 必须传 root 选项。数据目录在应用目录之外，
 * 直接传绝对路径会被 Express 5 以 "Not Found" 拒绝。
 */
app.get('/data/sessions/:sessionId/:file', auth.requireAuth, (req, res) => {
  const { sessionId, file } = req.params;

  if (!isValidSessionId(sessionId) || !/^drawing\.(png|jpe?g|webp|gif)$/i.test(file)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const answersPath = path.join(SESSIONS_DIR, sessionId, 'answers.json');
  if (!fs.existsSync(answersPath)) return res.status(404).json({ error: 'Not found' });

  const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
  const isAdmin = req.user.role === 'admin';
  const isOwner = answers.ownerId && answers.ownerId === req.user.sub;
  if (!isAdmin && !isOwner) return res.status(404).json({ error: 'Not found' });

  return res.sendFile(path.join(sessionId, file), { root: SESSIONS_DIR }, (err) => {
    if (err && !res.headersSent) {
      console.error('[Server] 图片发送失败:', err.message);
      res.status(404).json({ error: 'Not found' });
    }
  });
});

const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('/*splat', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/data')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

/* --------------------------------- 错误处理 ---------------------------------- */

app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? '图片不能超过 10MB' : '文件上传失败';
    return res.status(400).json({ error: msg });
  }
  if (err) {
    console.error('[Server Error]', err.message);
    return res.status(400).json({ error: err.message || '请求处理失败' });
  }
  res.status(500).json({ error: '服务器内部错误' });
});


/* ------------------------------- 数据完整性审计 ------------------------------- */

/**
 * 启动时记录数据规模，并与上次记录比对。
 *
 * 见 DATA_PROTECTION.md：本项目禁止删除报告数据。
 * 这里做不了强制拦截（磁盘操作在应用之外），但一旦数据减少会立即告警，
 * 让问题在发生当次就被发现，而不是等用户来问。
 */
function auditDataIntegrity() {
  const LEDGER = path.join(DATA_DIR, '.data-ledger.json');

  const sessions = fs.existsSync(SESSIONS_DIR)
    ? fs.readdirSync(SESSIONS_DIR).filter((d) =>
        fs.existsSync(path.join(SESSIONS_DIR, d, 'answers.json'))
      )
    : [];
  const reports = sessions.filter((d) =>
    fs.existsSync(path.join(SESSIONS_DIR, d, 'report.json'))
  );
  const userCount = Object.keys(
    fs.existsSync(path.join(DATA_DIR, 'users.json'))
      ? JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf-8'))
      : {}
  ).length;

  const now = {
    sessions: sessions.length,
    reports: reports.length,
    users: userCount,
    sessionIds: sessions.sort(),
    checkedAt: new Date().toISOString()
  };

  if (fs.existsSync(LEDGER)) {
    try {
      const prev = JSON.parse(fs.readFileSync(LEDGER, 'utf-8'));
      const missing = (prev.sessionIds || []).filter((id) => !sessions.includes(id));

      if (missing.length) {
        console.error('');
        console.error('╔══════════════════════════════════════════════════════════╗');
        console.error('║  ⚠️  数据丢失告警：检测到会话记录减少                      ║');
        console.error('╚══════════════════════════════════════════════════════════╝');
        console.error(`  上次启动: ${prev.sessions} 个会话 / ${prev.reports} 份报告`);
        console.error(`  本次启动: ${now.sessions} 个会话 / ${now.reports} 份报告`);
        console.error(`  丢失的会话 ID:`);
        missing.forEach((id) => console.error(`    - ${id}`));
        console.error('');
        console.error('  本项目禁止删除报告数据，详见 DATA_PROTECTION.md');
        console.error('  请立即排查原因并从备份恢复。');
        console.error('');
      }
    } catch {
      /* ledger 损坏则忽略，下面会重写 */
    }
  }

  fs.writeFileSync(LEDGER, JSON.stringify(now, null, 2), 'utf-8');
  return now;
}

app.listen(PORT, () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  console.log(`[Server] 服务已启动: http://localhost:${PORT}`);
  console.log(`[Server] AI Provider: ${provider}${provider === 'mock' ? ' (开发模式，不调用真实模型)' : ''}`);
  console.log(`[Server] 数据目录: ${DATA_DIR}`);
  const stats = auditDataIntegrity();
  console.log(`[Server] 数据规模: ${stats.users} 个账号 / ${stats.sessions} 个会话 / ${stats.reports} 份报告`);
  if (DATA_DIR.startsWith('/tmp/')) {
    console.warn('[Server] ⚠️  数据存放在 /tmp 下，系统重启后会丢失。请设置 DATA_DIR 指向持久化目录。');
  }
});
