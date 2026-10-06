import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    if (!token || token === 'mock-socket-auth') {
      if (socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      } else if (socket.handshake.headers?.cookie) {
        try {
          const cookieEntries = socket.handshake.headers.cookie
            .split(';')
            .map((c) => {
              const idx = c.indexOf('=');
              if (idx === -1) return null;
              return [c.substring(0, idx).trim(), decodeURIComponent(c.substring(idx + 1).trim())];
            })
            .filter(Boolean);
          const cookies = Object.fromEntries(cookieEntries);
          token = cookies['accessToken'];
        } catch (e) {}
      }
    }

    if (token && token !== 'mock-socket-auth') {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || 'buildconnect_access_secret_super_secure_key_2026!@#$'
        );
        const uId = (decoded.id || decoded._id || '').toString();
        socket.user = {
          ...decoded,
          id: uId,
          _id: uId,
          role: decoded.role || 'CLIENT',
        };
        return next();
      } catch (err) {
        // Fallback to userId if JWT expired or failed
      }
    }

    const userId = socket.handshake.auth?.userId;
    if (userId) {
      const uId = userId.toString();
      socket.user = {
        id: uId,
        _id: uId,
        role: socket.handshake.auth?.role || 'CLIENT',
      };
      return next();
    }

    return next(new Error('Socket Auth Error: Authentication required'));
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?._id;
    console.log(`[Socket.IO] Client connected: ${userId} (${socket.id})`);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      socket.join(room);
      console.log(`[Socket.IO] User ${userId} joined room ${room}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      socket.leave(room);
      console.log(`[Socket.IO] User ${userId} left room ${room}`);
    });

    socket.on('typing_start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId,
        conversationId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
