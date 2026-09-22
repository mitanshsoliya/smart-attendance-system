import { io } from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

let socket = null;

/**
 * Returns the singleton socket.io-client connection.
 * Lazily initializes on first call and maintains connection across components.
 * @returns {import("socket.io-client").Socket}
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to backend server successfully. Socket ID:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.io] Disconnected from server:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket.io] Connection warning:", err.message);
    });
  }

  return socket;
}

export default getSocket;
