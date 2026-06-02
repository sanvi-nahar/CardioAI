const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const simulateVitals = require("./src/simulator");

const FRONTEND_URLS = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) 
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || FRONTEND_URLS.includes(origin) || origin === "http://localhost:5173") {
        callback(null, true);
      } else {
        callback(new Error("CORS BLOCKED: Origin not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

global.io = io;

const jwt = require("jsonwebtoken");
const User = require("./src/models/User");

app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return next(new Error("Authentication error: Invalid token payload"));
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return next(new Error("Authentication error: User inactive or not found"));
    }

    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error: Failed to verify token"));
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 Authenticated Client connected: ${socket.id} (User: ${socket.user.name})`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

simulateVitals(io);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to database:', err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});
