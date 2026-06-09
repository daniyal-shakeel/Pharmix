import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth, useNotifications } from '@/store';
import { toast } from 'sonner';

const SOCKET_URL = "http://localhost:5000";

export function useNotificationsSocket() {
  const user = useAuth((s) => s.user);
  const addNotification = useNotifications((s) => s.addNotification);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to notification socket');
      socket.emit('join-entity', user.entityId || user.id);
      socket.emit('join-role', user.role);
    });

    socket.on('notification', (notification) => {
      addNotification(notification);
      toast(notification.title, {
        description: notification.message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, addNotification]);

  return socketRef.current;
}
