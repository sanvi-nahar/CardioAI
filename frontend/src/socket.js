import { io } from "socket.io-client";

export const createSocketConnection = (token) => {
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
  
  // Resolve base URL for Socket.IO connection
  const socketUrl = apiBase.startsWith('http') 
    ? apiBase.replace('/api', '') 
    : window.location.origin;

  const socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

