import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Wifi, WifiOff, Menu, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuClick }) {
  const { connected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
  };

  useEffect(() => { fetchNotifications(); }, []);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Global search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/products?search=${search}&limit=6`);
        setSearchResults(data.products || []);
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/markallread');
      setUnread(0);
      fetchNotifications();
    } catch {}
  };

  const typeColor = { warning: 'text-amber-400', error: 'text-red-400', success: 'text-emerald-400', info: 'text-blue-400' };

  return (
    <header className="h-14 bg-[#0d1424] border-b border-surface-border flex items-center px-4 gap-4 sticky top-0 z-30">
      <button onClick={onMenuClick} className="lg:hidden text-slate-400 hover:text-white">
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products, SKU, barcode..."
          className="input pl-9 py-1.5 text-sm h-9"
        />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-full bg-surface-card border border-surface-border rounded-lg shadow-xl z-50 overflow-hidden">
            {searchResults.map(p => (
              <button
                key={p._id}
                onClick={() => { navigate(`/products/${p._id}/edit`); setSearch(''); setSearchResults([]); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-border transition-all text-left"
              >
                <div className="w-7 h-7 rounded bg-primary-600/20 flex items-center justify-center flex-shrink-0 text-xs text-primary-400 font-mono">
                  {p.sku?.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm text-slate-200">{p.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                </div>
                <div className={`ml-auto text-xs font-medium status-badge badge-${p.stockStatus}`}>
                  {p.totalStock} {p.unit}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(o => !o)}
            className="relative p-1.5 text-slate-400 hover:text-white hover:bg-surface-card rounded-lg transition-all"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface-card border border-surface-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                <span className="font-semibold text-white text-sm">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No notifications</p>
                ) : notifications.map(n => (
                  <div key={n._id} className={`px-4 py-3 border-b border-surface-border/50 hover:bg-surface-border/30 transition-all ${!n.readBy?.includes(user?._id) ? 'bg-primary-500/5' : ''}`}>
                    <p className={`text-sm font-medium ${typeColor[n.type] || 'text-slate-300'}`}>{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
