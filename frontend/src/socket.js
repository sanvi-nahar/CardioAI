import { io } from "socket.io-client";

export const createSocketConnection = (token) => {
  const socket = io(import.meta.env.VITE_API_BASE.replace('/api', ''), {
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
