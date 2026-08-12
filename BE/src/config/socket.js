const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  // Authentication Middleware for Socket.io
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, tenantId, role } = socket.user;
    console.log(`🔌 Socket Connected: ${socket.id} (User: ${userId}, Role: ${role})`);

    // Join personal user room
    if (userId) {
      socket.join(`user_${userId}`);
    }

    // Join manager/admin room for tenant if user is manager, admin or super_admin
    if (tenantId && ['manager', 'admin', 'super_admin'].includes(role)) {
      socket.join(`tenant_${tenantId}_managers`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
