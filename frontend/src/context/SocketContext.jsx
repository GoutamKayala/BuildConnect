import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE, formatBaseUrl } from '../api/axios';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const userId = (user._id || user.id || '').toString();
    const token = localStorage.getItem('accessToken');

    let socketServerUrl = import.meta.env.VITE_SOCKET_URL
      ? formatBaseUrl(import.meta.env.VITE_SOCKET_URL)
      : '';

    if (!socketServerUrl) {
      if (API_BASE && /^https?:\/\//i.test(API_BASE)) {
        socketServerUrl = API_BASE.replace(/\/api\/?$/, '');
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketServerUrl = 'http://localhost:5000';
      } else {
        socketServerUrl = window.location.origin;
      }
    }

    console.log('[Socket] Connecting to server:', socketServerUrl);

    const newSocket = io(socketServerUrl, {
      auth: {
        token,
        userId,
        role: user.role,
      },
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected successfully, socketId:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning:', err.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
