import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
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
        socket.user = decoded;
        return next();
      } catch (err) {
        // Fallback to userId if JWT expired or failed
      }
    }

    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.user = { id: userId.toString(), role: socket.handshake.auth?.role || 'CLIENT' };
      return next();
    }

    return next(new Error('Socket Auth Error: Authentication required'));
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.user.id} (${socket.id})`);

    socket.join(`user:${socket.user.id}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket.IO] User ${socket.user.id} joined conversation:${conversationId}`);
    });

    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        conversationId,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.user.id,
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
