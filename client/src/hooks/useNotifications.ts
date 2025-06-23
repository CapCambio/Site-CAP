
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  type: 'priceChanges' | 'newCurrencies' | 'systemUpdates';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export function useNotifications(userEmail: string | null) {
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userEmail) return;

    // Conectar ao WebSocket
    socketRef.current = io();

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Conectado ao sistema de notificações');
      // Inscrever-se para receber notificações
      socket.emit('subscribe', userEmail);
    });

    socket.on('notification', (notification: NotificationData) => {
      console.log('Notificação recebida:', notification);
      
      // Mostrar toast com a notificação
      toast({
        title: notification.title,
        description: notification.message,
        duration: 8000,
      });

      // Tentar mostrar notificação nativa do navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `cap-cotacoes-${Date.now()}`
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do sistema de notificações');
    });

    // Solicitar permissão para notificações nativas
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userEmail, toast]);

  return {
    requestNotificationPermission: () => {
      if ('Notification' in window) {
        return Notification.requestPermission();
      }
      return Promise.resolve('denied' as NotificationPermission);
    }
  };
}
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export function useNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const newSocket = io('/', {
      autoConnect: false
    });

    newSocket.on('notification', (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Manter apenas 50 notificações
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToNotifications = (email: string) => {
    if (socket) {
      socket.connect();
      socket.emit('subscribe', email);
    }
  };

  const unsubscribe = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  return {
    notifications,
    subscribeToNotifications,
    unsubscribe,
    clearNotifications: () => setNotifications([])
  };
}
