// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const setupSwagger = require('./config/swagger');

const app = express();

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---------- SECURITY MIDDLEWARE ----------

// Helmet: Sets various HTTP headers for security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting: Prevent brute-force and DoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login/register attempts per windowMs
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// ---------- CORS CONFIG ----------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl requests)
      if (!origin) return callback(null, true);
      if (origin === FRONTEND) return callback(null, true);
      return callback(new Error("CORS BLOCKED: Origin not allowed"), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ---------- BODY PARSING MIDDLEWARE ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- LOGGING ----------
// Use morgan in development only
if (NODE_ENV === 'development') {
  app.use(morgan("dev"));
}

// ---------- ROUTES ----------
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/ai-summary", require("./routes/aiRoutes"));

// Health Check
app.get("/api/health", (req, res) => res.json({ 
  status: "ok", 
  timestamp: new Date().toISOString(),
  environment: NODE_ENV
}));

// Swagger API Docs
setupSwagger(app);

// ---------- ROUTE NOT FOUND & ERROR HANDLERS ----------
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

app.use(notFound);
app.use(errorHandler);

module.exports = app;
