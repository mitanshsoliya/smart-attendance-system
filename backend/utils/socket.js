const { Server } = require("socket.io");

let io = null;

/**
 * Initializes the Socket.io server instance attached to an HTTP server.
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Client joins a specific lecture room (used by faculty & enrolled students)
    socket.on("join_lecture", (lectureId) => {
      if (lectureId) {
        const room = `lecture_${lectureId}`;
        socket.join(room);
      }
    });

    // Client leaves a lecture room
    socket.on("leave_lecture", (lectureId) => {
      if (lectureId) {
        socket.leave(`lecture_${lectureId}`);
      }
    });

    // Client joins a department broadcast room (used by students for live session alerts)
    socket.on("join_department", (department) => {
      if (department) {
        const cleanDept = String(department).trim().toUpperCase();
        socket.join(`dept_${cleanDept}`);
      }
    });

    // Client leaves a department broadcast room
    socket.on("leave_department", (department) => {
      if (department) {
        const cleanDept = String(department).trim().toUpperCase();
        socket.leave(`dept_${cleanDept}`);
      }
    });

    socket.on("disconnect", () => {
      // Graceful disconnect
    });
  });

  return io;
}

/**
 * Returns the initialized Socket.io instance.
 * @returns {import("socket.io").Server}
 */
function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initSocket(httpServer) first.");
  }
  return io;
}

/**
 * Helper to emit an event to all clients in a specific lecture room.
 * @param {string|number} lectureId
 * @param {string} event
 * @param {object} payload
 */
function emitToLecture(lectureId, event, payload) {
  if (io && lectureId) {
    io.to(`lecture_${lectureId}`).emit(event, payload);
  }
}

/**
 * Helper to broadcast an event to an entire department (e.g. "CSE", "IT", "ECE").
 * @param {string} department
 * @param {string} event
 * @param {object} payload
 */
function emitToDepartment(department, event, payload) {
  if (io && department) {
    const cleanDept = String(department).trim().toUpperCase();
    io.to(`dept_${cleanDept}`).emit(event, payload);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToLecture,
  emitToDepartment,
};
