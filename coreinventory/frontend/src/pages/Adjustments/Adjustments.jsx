// Adjustments.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, StatusBadge, EmptyState, Loader, Pagination } from '../../components/common';
import { format } from 'date-fns';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [pages, setPages] = useState(1); const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.status) p.set('status', filters.status);
      p.set('page', filters.page); p.set('limit', '20');
      const { data } = await api.get(`/adjustments?${p}`);
      setAdjustments(data.adjustments); setPages(data.pages); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      <PageHeader title="Stock Adjustments" subtitle={`${total} adjustment records`}
        actions={<Link to="/adjustments/new" className="btn-primary"><Plus size={15} /> New Adjustment</Link>} />

      <div className="card flex flex-wrap gap-3 p-4">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className="input h-9 w-44 bg-surface-card">
          <option value="">All Status</option>
          {['draft','in_progress','done','canceled'].map(s => <option key={s} value={s}>{s.replace('_',' ').charAt(0).toUpperCase()+s.replace('_',' ').slice(1)}</option>)}
        </select>
        <button onClick={fetch} className="btn-secondary h-9 px-3"><RefreshCw size={14} /></button>
      </div>

      {loading ? <Loader /> : adjustments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No adjustments found" description="Create an adjustment to fix stock discrepancies"
          action={<Link to="/adjustments/new" className="btn-primary"><Plus size={14} /> New Adjustment</Link>} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>{['Reference','Warehouse','Lines','Reason','Date','Status',''].map(h => <th key={h} className="table-head text-left px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {adjustments.map(a => (
                  <tr key={a._id} className="hover:bg-surface-border/20 transition-colors group">
                    <td className="table-cell font-mono text-primary-400 text-xs">{a.reference}</td>
                    <td className="table-cell text-slate-300">{a.warehouse?.name}</td>
                    <td className="table-cell text-slate-400">{a.lines?.length} items</td>
                    <td className="table-cell text-slate-400 text-xs max-w-32 truncate">{a.reason || '—'}</td>
                    <td className="table-cell text-slate-400 text-xs">{format(new Date(a.createdAt), 'dd MMM yyyy')}</td>
                    <td className="table-cell"><StatusBadge status={a.status} /></td>
                    <td className="table-cell">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {a.status !== 'done' && a.status !== 'canceled' && (
                          <Link to={`/adjustments/${a._id}/edit`} className="btn-secondary py-1 px-2 text-xs">Edit</Link>
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
