import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ClipboardList, History, Warehouse, Settings,
  LogOut, User, BarChart3, ChevronDown, Box
} from 'lucide-react';
import { useState } from 'react';

const NavItem = ({ to, icon: Icon, label, end = false }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
    <Icon size={16} />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col h-full w-64 bg-[#0d1424] border-r border-surface-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Box size={16} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm leading-none">CoreInventory</div>
          <div className="text-xs text-slate-500 mt-0.5">IMS Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3 mb-2">Main</div>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />

        <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3 mt-4 mb-2">Inventory</div>
        <NavItem to="/products" icon={Package} label="Products" />
        <NavItem to="/products/categories" icon={ClipboardList} label="Categories" />

        <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3 mt-4 mb-2">Operations</div>
        <NavItem to="/receipts" icon={ArrowDownToLine} label="Receipts" />
        <NavItem to="/deliveries" icon={ArrowUpFromLine} label="Deliveries" />
        <NavItem to="/transfers" icon={ArrowLeftRight} label="Transfers" />
        <NavItem to="/adjustments" icon={ClipboardList} label="Adjustments" />
        <NavItem to="/history" icon={History} label="Move History" />

        <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3 mt-4 mb-2">Analytics</div>
        <NavItem to="/reports" icon={BarChart3} label="Reports" />

        {/* Settings collapsible */}
        <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3 mt-4 mb-2">Config</div>
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="sidebar-link w-full justify-between"
        >
          <span className="flex items-center gap-3"><Settings size={16} /><span>Settings</span></span>
          <ChevronDown size={14} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
        </button>
        {settingsOpen && (
          <div className="pl-4 space-y-0.5">
            <NavItem to="/settings/warehouses" icon={Warehouse} label="Warehouses" />
          </div>
        )}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-surface-border p-3">
        <NavLink to="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-card transition-all group">
          <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              : <User size={14} className="text-primary-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="mt-1 sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={15} /><span>Logout</span>
        </button>
      </div>
    </div>
  );
}
