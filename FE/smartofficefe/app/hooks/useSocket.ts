import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  onNotification?: (data: any) => void;
}

export const useSocket = (options?: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    // Initialize socket connection
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected:', socket.id);
    });

    socket.on('notification:new', (data) => {
      console.log('🔔 New Notification Received:', data);
      if (options?.onNotification) {
        options.onNotification(data);
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    return () => {
      if (socket) {
        socket.disconnect();
        console.log('⚡ Socket disconnected');
      }
    };
  }, []);

  return {
    socket: socketRef.current,
  };
};
