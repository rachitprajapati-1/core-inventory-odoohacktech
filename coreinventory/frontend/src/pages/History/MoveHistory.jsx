import { useState, useEffect, useCallback } from 'react';
import { History, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loader, EmptyState, Pagination } from '../../components/common';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  receipt:      { label: 'Receipt',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', sign: '+' },
  delivery:     { label: 'Delivery',     color: 'text-red-400',     bg: 'bg-red-500/10',     sign: '-' },
  transfer_in:  { label: 'Transfer In',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    sign: '+' },
  transfer_out: { label: 'Transfer Out', color: 'text-purple-400',  bg: 'bg-purple-500/10',  sign: '-' },
  adjustment:   { label: 'Adjustment',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   sign: '±' },
  initial:      { label: 'Initial',      color: 'text-slate-400',   bg: 'bg-slate-500/10',   sign: '+' },
};

export default function MoveHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', warehouse: '', page: 1 });
  const [pages, setPages] = useState(1); const [total, setTotal] = useState(0);
  const [warehouses, setWarehouses] = useState([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.type) p.set('type', filters.type);
      if (filters.warehouse) p.set('warehouse', filters.warehouse);
      p.set('page', filters.page); p.set('limit', '30');
      const { data } = await api.get(`/ledger?${p}`);
      setEntries(data.entries); setPages(data.pages); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    api.get('/warehouses').then(r => setWarehouses(r.data.warehouses)).catch(() => {});
  }, []);

  const exportExcel = async () => {
    try {
      const p = new URLSearchParams();
      if (filters.type) p.set('type', filters.type);
      if (filters.warehouse) p.set('warehouse', filters.warehouse);
      const res = await api.get(`/export/ledger/excel?${p}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `ledger_${Date.now()}.xlsx`; a.click();
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Move History" subtitle={`${total} stock movements logged`}
        actions={
          <button onClick={exportExcel} className="btn-secondary"><Download size={15} /> Export Excel</button>
        }
      />

      <div className="card flex flex-wrap gap-3 p-4">
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))} className="input h-9 w-44 bg-surface-card">
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filters.warehouse} onChange={e => setFilters(f => ({ ...f, warehouse: e.target.value, page: 1 }))} className="input h-9 w-48 bg-surface-card">
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <button onClick={fetch} className="btn-secondary h-9 px-3"><RefreshCw size={14} /></button>
      </div>

      {loading ? <Loader /> : entries.length === 0 ? (
        <EmptyState icon={History} title="No movements yet" description="Stock movements will appear here after validating receipts, deliveries, or transfers." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>{['Date','Reference','Type','Product','Warehouse','Qty','Before','After','By','Notes'].map(h => <th key={h} className="table-head text-left px-3 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {entries.map(e => {
                  const cfg = TYPE_CONFIG[e.type] || { label: e.type, color: 'text-slate-400', bg: 'bg-slate-500/10' };
                  return (
                    <tr key={e._id} className="hover:bg-surface-border/20 transition-colors">
                      <td className="table-cell text-slate-500 text-xs whitespace-nowrap">{format(new Date(e.createdAt), 'dd MMM yy, HH:mm')}</td>
                      <td className="table-cell font-mono text-xs text-primary-400">{e.reference}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                      </td>
                      <td className="table-cell">
                        <div className="text-slate-200 text-sm">{e.product?.name || '—'}</div>
                        <div className="text-slate-500 text-xs font-mono">{e.product?.sku}</div>
                      </td>
                      <td className="table-cell text-slate-400 text-xs">{e.warehouse?.name || '—'}</td>
                      <td className="table-cell">
                        <div className={`flex items-center gap-1 font-mono font-semibold text-sm ${e.quantity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {e.quantity >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {e.quantity >= 0 ? '+' : ''}{e.quantity} {e.unit}
                        </div>
                      </td>
                      <td className="table-cell font-mono text-slate-400 text-xs">{e.balanceBefore}</td>
                      <td className="table-cell font-mono text-slate-200 text-xs font-semibold">{e.balanceAfter}</td>
                      <td className="table-cell text-slate-500 text-xs">{e.performedBy?.name || '—'}</td>
                      <td className="table-cell text-slate-500 text-xs max-w-32 truncate">{e.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={filters.page} pages={pages} onPage={p => setFilters(f => ({ ...f, page: p }))} />
    </div>
  );
}
