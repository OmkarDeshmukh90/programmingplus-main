const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const questionRoutes = require('./routes/questions');
const submissionRoutes = require('./routes/submissions');
const codeExecutionRoutes = require('./routes/codeExecution');
const aiRoutes = require('./routes/ai');
const discussRoutes = require('./routes/discuss');
const dashboardRoutes = require('./routes/dashboard');
const contestRoutes = require('./routes/contests');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const learningPathRoutes = require('./routes/learningPaths');
const interviewRoutes = require('./routes/interviews');
const initLiveInterviewSocket = require('./socket/liveInterviewSocket');

const app = express();

// Global Exception Handler - Prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// NUCLEAR CORS (MOST PERMISSIVE)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  
  // If credentials are allowed, Origin CANNOT be '*'
  // We must echo the specific origin.
  res.setHeader('Access-Control-Allow-Origin', origin === '*' ? 'http://localhost:5173' : origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { clerkMiddleware } = require('@clerk/express');
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// Trace 401 errors
app.use((req, res, next) => {
  const originalStatus = res.status;
  res.status = function(code) {
    if (code === 401 || code === 403) {
      console.warn(`[TRACE] Status ${code} set for ${req.method} ${req.url}`);
      console.trace();
    }
    return originalStatus.apply(res, arguments);
  };
  next();
});

app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoConnected = mongoState === 1;
  res.status(mongoConnected ? 200 : 503).json({
    status: mongoConnected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: {
      connected: mongoConnected,
      state: mongoState,
      dbName: mongoose.connection.name || null,
    },
  });
});

app.use('/api/ai', aiRoutes);
app.use('/api/code', codeExecutionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/discuss', discussRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api', authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const socketCors = {
  origin: "*",
  credentials: true,
};

const io = new Server(server, {
  cors: socketCors,
});

initLiveInterviewSocket(io);

// Global error handler - MUST BE LAST
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
