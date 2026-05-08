require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const errorMiddleware = require('./middleware/error.middleware');
const ApiError = require('./utils/ApiError');

const authRoutes        = require('./routes/auth.routes');
const patientRoutes     = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const intakeRoutes      = require('./routes/intake.routes');
const briefRoutes       = require('./routes/brief.routes');
const adminRoutes       = require('./routes/admin.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const labReportRoutes   = require('./routes/labReport.routes');
const voiceNoteRoutes   = require('./routes/voiceNote.routes');
const chatbotRoutes     = require('./routes/chatbot.routes');

const app = express();

// Security
app.use(helmet());

// CORS - Allow multiple origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      // Remove trailing slash for comparison
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });

app.use('/api/v1/auth', authLimiter);
app.use(generalLimiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/patients',      patientRoutes);
app.use('/api/v1/appointments',  appointmentRoutes);
app.use('/api/v1/intake',        intakeRoutes);
app.use('/api/v1/briefs',        briefRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/lab-reports',   labReportRoutes);
app.use('/api/v1/voice-notes',   voiceNoteRoutes);
app.use('/api/v1/chatbot',       chatbotRoutes);

// Serve uploaded files
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res, next) => next(new ApiError(404, `Route ${req.originalUrl} not found`)));

// Error handler
app.use(errorMiddleware);

module.exports = app;
