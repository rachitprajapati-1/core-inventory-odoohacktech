import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const s = io('/', { transports: ['websocket', 'polling'] });
    s.on('connect', () => { setConnected(true); });
    s.on('disconnect', () => setConnected(false));

    s.on('notification:new', ({ notification }) => {
      const icons = { warning: '⚠️', error: '❌', success: '✅', info: 'ℹ️' };
      toast(notification.message, { icon: icons[notification.type] || 'ℹ️', duration: 5000 });
    });

    s.on('stock:updated', () => {
      // Trigger refetch via custom event
      window.dispatchEvent(new Event('stock:updated'));
    });

    setSocket(s);
    return () => { s.disconnect(); setSocket(null); };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
