// StatusBadge
export const StatusBadge = ({ status }) => {
  const labels = {
    draft: 'Draft', waiting: 'Waiting', ready: 'Ready', done: 'Done',
    canceled: 'Canceled', in_progress: 'In Progress',
    in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock',
  };
  return (
    <span className={`status-badge badge-${status}`}>
      {labels[status] || status}
    </span>
  );
};

// PageHeader
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

// StatCard
export const StatCard = ({ label, value, icon: Icon, color = 'primary', trend, onClick }) => {
  const colors = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  return (
    <div
      onClick={onClick}
      className={`card glow-purple flex items-center gap-4 ${onClick ? 'cursor-pointer hover:border-primary-500/40 transition-all' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-xs uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value ?? '—'}</p>
        {trend && <p className="text-xs text-slate-500 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
};

// EmptyState
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mb-4">
      <Icon size={28} className="text-slate-600" />
    </div>
    <h3 className="text-slate-300 font-semibold text-base">{title}</h3>
    {description && <p className="text-slate-500 text-sm mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Loader
export const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-slate-500 text-sm">{text}</p>
  </div>
);

// Table wrapper
export const Table = ({ headers, children, className = '' }) => (
  <div className={`card overflow-hidden p-0 ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-surface-border">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="table-head text-left px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border/50">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);

// Modal
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-surface-card border border-surface-border rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="font-bold text-white text-base">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-border transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// Select
export const Select = ({ label, value, onChange, options, className = '', required }) => (
  <div className={className}>
    {label && <label className="label">{label}{required && ' *'}</label>}
    <select value={value} onChange={onChange} className="input bg-surface-card" required={required}>
      <option value="">Select...</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

// Pagination
export const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">←</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <button key={p} onClick={() => onPage(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-primary-600 text-white' : 'btn-secondary'}`}>
            {p}
          </button>
        );
      })}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">→</button>
    </div>
  );
};
