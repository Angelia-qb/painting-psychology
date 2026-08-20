import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { generateReport } from './lib/analyzer.js';
import { newShortCode, normalizeShortCode } from './lib/shortcode.js';
import { rateLimit } from './lib/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
app.post('/api/submit', submitLimiter, upload.single('drawing'), async (req, res) => {
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

    console.log(`[Server] 会话 ${req.sessionId} 数据已保存（短码 ${answers.shortCode}）`);

    // 先响应，让用户看到成功页，分析在后台跑
    res.status(200).json({
      success: true,
      message: '数据已保存，分析报告正在生成中',
      sessionId: req.sessionId,
      shortCode: answers.shortCode
    });

    runAnalysis(req.sessionId, answers, path.join(req.sessionPath, req.file.filename));
  } catch (error) {
    console.error('[Server Error] 提交失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
});

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
 * 手动重新生成报告（分析失败时可重试）
 */
app.post('/api/report/:sessionId/regenerate', reportLimiter, async (req, res) => {
  const sessionId = resolveToSessionId(req.params.sessionId);
  if (!sessionId) {
    return res.status(400).json({ error: '查询码格式不正确' });
  }

  const dir = sessionPathOf(sessionId);
  const answersPath = path.join(dir, 'answers.json');
  if (!fs.existsSync(answersPath)) {
    return res.status(404).json({ error: '会话不存在' });
  }

  const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
  const imagePath = path.join(dir, answers.filename);

  res.status(202).json({ success: true, message: '已重新开始分析', sessionId });
  runAnalysis(sessionId, answers, imagePath);
});

/**
 * 获取报告。返回 status 字段供前端轮询：
 *   analyzing / done / failed / pending
 */
app.get('/api/report/:sessionId', reportLimiter, (req, res) => {
  const sessionId = resolveToSessionId(req.params.sessionId);

  if (!sessionId) {
    return res.status(400).json({ error: '查询码格式不正确，请检查输入' });
  }

  const dir = sessionPathOf(sessionId);
  const reportPath = path.join(dir, 'report.json');
  const answersPath = path.join(dir, 'answers.json');
  const statusPath = path.join(dir, 'status.json');

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: '会话ID不存在，请检查输入是否正确' });
  }

  const result = {
    sessionId,
    shortCode: null,
    hasAnswers: fs.existsSync(answersPath),
    hasReport: fs.existsSync(reportPath),
    answers: null,
    report: null,
    status: 'pending',
    statusMessage: ''
  };

  if (result.hasAnswers) {
    result.answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
    result.shortCode = result.answers.shortCode || null;
  }
  if (result.hasReport) {
    result.report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  }
  if (fs.existsSync(statusPath)) {
    const s = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    result.status = s.state;
    result.statusMessage = s.message;
  } else if (result.hasReport) {
    result.status = 'done';
  }

  return res.status(200).json(result);
});

/* ---------------------------------- 静态资源 --------------------------------- */

// 仅暴露 sessions 下的图片：
// codes.json 含全部查询码映射，answers/report 应经接口获取，都不能直接下载
app.use('/data/sessions', (req, res, next) => {
  if (!/\.(png|jpe?g|webp|gif)$/i.test(req.path)) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}, express.static(SESSIONS_DIR));

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

app.listen(PORT, () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  console.log(`[Server] 服务已启动: http://localhost:${PORT}`);
  console.log(`[Server] AI Provider: ${provider}${provider === 'mock' ? ' (开发模式，不调用真实模型)' : ''}`);
  console.log(`[Server] 数据目录: ${DATA_DIR}`);
  if (DATA_DIR.startsWith('/tmp/')) {
    console.warn('[Server] ⚠️  数据存放在 /tmp 下，系统重启后会丢失。请设置 DATA_DIR 指向持久化目录。');
  }
});
