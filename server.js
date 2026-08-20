import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { generateReport } from './lib/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const SESSIONS_DIR = path.join(__dirname, 'data', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/* --------------------------------- 工具函数 --------------------------------- */

// sessionId 用随机串而非时间戳，避免被枚举猜到别人的报告
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

/* ------------------------------------ 路由 ----------------------------------- */

/**
 * 提交画作与问卷。
 * 保存 answers.json 后立即返回 sessionId，AI 分析在后台异步进行，
 * 前端通过轮询 /api/report/:sessionId 获取结果。
 */
app.post('/api/submit', upload.single('drawing'), async (req, res) => {
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

    console.log(`[Server] 会话 ${req.sessionId} 数据已保存`);

    // 先响应，让用户看到成功页，分析在后台跑
    res.status(200).json({
      success: true,
      message: '数据已保存，分析报告正在生成中',
      sessionId: req.sessionId
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
app.post('/api/report/:sessionId/regenerate', async (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: '会话ID格式不正确' });
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
app.get('/api/report/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: '会话ID格式不正确，请检查输入' });
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
    hasAnswers: fs.existsSync(answersPath),
    hasReport: fs.existsSync(reportPath),
    answers: null,
    report: null,
    status: 'pending',
    statusMessage: ''
  };

  if (result.hasAnswers) {
    result.answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
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

app.use('/data', express.static(path.join(__dirname, 'data')));

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
});
