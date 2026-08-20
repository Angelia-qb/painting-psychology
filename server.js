import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS so the React app running on another port (e.g. 5173) can access the API in development
app.use(cors());
app.use(express.json());

// Set up directories
const SESSIONS_DIR = path.join(__dirname, 'data', 'sessions');

// Ensure directories exist
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Multer storage engine to dynamically create a session directory and save the drawing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Generate a unique session folder name using timestamp
    const sessionId = `session_${Date.now()}`;
    const sessionPath = path.join(SESSIONS_DIR, sessionId);
    
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    
    // Store the path in req so it's accessible in the handler
    req.sessionId = sessionId;
    req.sessionPath = sessionPath;
    cb(null, sessionPath);
  },
  filename: (req, file, cb) => {
    // Keep original file extension but rename to 'drawing'
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `drawing${ext}`);
  }
});

const upload = multer({ storage });

// API Route to submit drawing and inquiry responses
app.post('/api/submit', upload.single('drawing'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No drawing file uploaded' });
    }

    const {
      drawingTitle,
      description,
      emotions,
      dialogue,
      backgroundContext
    } = req.body;

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

    // Save answers.json in the same session folder
    const answersPath = path.join(req.sessionPath, 'answers.json');
    fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2), 'utf-8');

    console.log(`[Server] Session ${req.sessionId} saved successfully!`);
    
    return res.status(200).json({
      success: true,
      message: 'Session data saved successfully',
      sessionId: req.sessionId,
      sessionDir: req.sessionPath
    });
  } catch (error) {
    console.error('[Server Error] Submit failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API Route to get report for a given sessionId
app.get('/api/report/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  const reportPath = path.join(sessionPath, 'report.json');
  const answersPath = path.join(sessionPath, 'answers.json');

  if (!fs.existsSync(sessionPath)) {
    return res.status(404).json({ error: '会话ID不存在，请检查输入是否正确' });
  }

  const result = {
    sessionId,
    hasAnswers: fs.existsSync(answersPath),
    hasReport: fs.existsSync(reportPath),
    answers: null,
    report: null
  };

  if (result.hasAnswers) {
    const rawAnswers = fs.readFileSync(answersPath, 'utf-8');
    result.answers = JSON.parse(rawAnswers);
  }

  if (result.hasReport) {
    const rawReport = fs.readFileSync(reportPath, 'utf-8');
    result.report = JSON.parse(rawReport);
  }

  return res.status(200).json(result);
});

// Serve session files statically (useful for viewing uploaded images locally)
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve Vite production build output statically from the 'dist' directory
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  
  // Wildcard fallback for single-page client routing (SPA)
  app.get('/*splat', (req, res, next) => {
    // Avoid intercepting API or static data requests
    if (req.path.startsWith('/api') || req.path.startsWith('/data')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Local Express server running at http://localhost:${PORT}`);
});
