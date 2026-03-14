// Receipts.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Inbox, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, StatusBadge, EmptyState, Loader, Pagination } from '../../components/common';
import { format } from 'date-fns';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.search) p.set('search', filters.search);
      if (filters.status) p.set('status', filters.status);
      p.set('page', filters.page); p.set('limit', '20');
      const { data } = await api.get(`/receipts?${p}`);
      setReceipts(data.receipts); setPages(data.pages); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { window.addEventListener('stock:updated', fetch); return () => window.removeEventListener('stock:updated', fetch); }, [fetch]);

  return (
    <div className="space-y-5">
      <PageHeader title="Receipts" subtitle={`${total} incoming stock records`}
        actions={<Link to="/receipts/new" className="btn-primary"><Plus size={15} /> New Receipt</Link>} />

      <div className="card flex flex-wrap gap-3 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} placeholder="Search reference, supplier..." className="input pl-9 h-9" />
        </div>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className="input h-9 w-36 bg-surface-card">
          <option value="">All Status</option>
          {['draft', 'waiting', 'ready', 'done', 'canceled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button onClick={fetch} className="btn-secondary h-9 px-3"><RefreshCw size={14} /></button>
      </div>

      {loading ? <Loader /> : receipts.length === 0 ? (
        <EmptyState icon={Inbox} title="No receipts found" description="Create a receipt to log incoming stock"
          action={<Link to="/receipts/new" className="btn-primary"><Plus size={14} /> New Receipt</Link>} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>{['Reference', 'Supplier', 'Warehouse', 'Date', 'Items', 'Status', ''].map(h => <th key={h} className="table-head text-left px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {receipts.map(r => (
                  <tr key={r._id} className="hover:bg-surface-border/20 transition-colors group">
                    <td className="table-cell font-mono text-primary-400 text-xs">{r.reference}</td>
                    <td className="table-cell font-medium text-slate-200">{r.supplier}</td>
                    <td className="table-cell text-slate-400">{r.warehouse?.name}</td>
                    <td className="table-cell text-slate-400 text-xs">{r.scheduledDate ? format(new Date(r.scheduledDate), 'dd MMM yyyy') : '—'}</td>
                    <td className="table-cell text-slate-400">{r.lines?.length} items</td>
                    <td className="table-cell"><StatusBadge status={r.status} /></td>
                    <td className="table-cell">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Link to={`/receipts/${r._id}`} className="btn-secondary py-1 px-2 text-xs">View</Link>
                        {r.status !== 'done' && r.status !== 'canceled' && (
                          <Link to={`/receipts/${r._id}/edit`} className="btn-secondary py-1 px-2 text-xs">Edit</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={filters.page} pages={pages} onPage={p => setFilters(f => ({ ...f, page: p }))} />
    </div>
  );
}
