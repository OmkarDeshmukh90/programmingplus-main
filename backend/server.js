const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const questionRoutes = require('./routes/questions');
const submissionRoutes = require('./routes/submissions');
const codeExecutionRoutes = require('./routes/codeExecution');
const aiRoutes = require('./routes/ai');
const discussRoutes = require('./routes/discuss');
const dashboardRoutes = require('./routes/dashboard');
const contestRoutes = require('./routes/contests');
const authRoutes = require('./routes/auth');

const app = express();

const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients and same-origin requests with no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/contests', contestRoutes);
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
