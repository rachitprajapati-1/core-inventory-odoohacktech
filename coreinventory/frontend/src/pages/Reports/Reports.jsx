import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Download, BarChart3, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Loader } from '../../components/common';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.name || p.dataKey}: {p.value}</p>)}
    </div>
  );
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/dashboard/stats'); setData(res); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const exportProducts = async (type) => {
    setExporting(type);
    try {
      const res = await api.get(`/export/products/${type}`, { responseType: 'blob' });
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `inventory_report_${Date.now()}.${ext}`; a.click();
      toast.success(`${type.toUpperCase()} exported!`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  const exportLedger = async () => {
    setExporting('ledger');
    try {
      const res = await api.get('/export/ledger/excel', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `stock_ledger_${Date.now()}.xlsx`; a.click();
      toast.success('Ledger exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  // Process chart data
  const chartMap = {};
  (data?.movementData || []).forEach(({ _id, total }) => {
    if (!chartMap[_id.date]) chartMap[_id.date] = { date: _id.date };
    chartMap[_id.date][_id.type] = total;
  });
  const movementChart = Object.values(chartMap).slice(-14);

  const stockData = (data?.topProducts || []).map(p => ({ name: p.name?.slice(0, 15) + (p.name?.length > 15 ? '…' : ''), stock: p.totalStock, reorder: p.reorderLevel }));
  const catData = (data?.categoryDist || []).map(c => ({ name: c.name, count: c.count, stock: c.totalStock }));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Inventory insights and exports" />

      {/* Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Products Report', desc: 'Full product list with stock levels', actions: [{ label: 'Excel', type: 'excel' }, { label: 'PDF', type: 'pdf' }] },
          { title: 'Stock Ledger', desc: 'All movement history with balances', actions: [{ label: 'Excel', type: 'ledger' }] },
        ].map(card => (
          <div key={card.title} className="card space-y-3">
            <div>
              <h3 className="font-semibold text-white">{card.title}</h3>
              <p className="text-slate-500 text-xs mt-0.5">{card.desc}</p>
            </div>
            <div className="flex gap-2">
              {card.actions.map(a => (
                <button key={a.type} disabled={!!exporting} onClick={() => a.type === 'ledger' ? exportLedger() : exportProducts(a.type)}
                  className="btn-secondary text-xs py-1.5">
                  {exporting === a.type ? <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download size={12} />}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="card flex items-center gap-4">
          <BarChart3 size={24} className="text-primary-400" />
          <div>
            <p className="text-white font-semibold">{data?.stats?.totalProducts ?? '—'} Products</p>
            <p className="text-slate-500 text-xs">{data?.stats?.lowStock ?? 0} low stock · {data?.stats?.outOfStock ?? 0} out of stock</p>
          </div>
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Movement trend */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Stock Movement Trend — Last 14 Days</h2>
              <button onClick={fetch} className="text-slate-500 hover:text-white"><RefreshCw size={14} /></button>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={movementChart} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="receipt" stroke="#10B981" dot={false} strokeWidth={2} name="Receipts" />
                <Line type="monotone" dataKey="delivery" stroke="#EF4444" dot={false} strokeWidth={2} name="Deliveries" />
                <Line type="monotone" dataKey="adjustment" stroke="#F59E0B" dot={false} strokeWidth={2} name="Adjustments" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top products stock chart */}
            <div className="card">
              <h2 className="font-semibold text-white mb-4 text-sm">Top Products — Stock vs Reorder Level</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="stock" fill="#6366F1" radius={[0, 4, 4, 0]} maxBarSize={16} name="Stock" />
                  <Bar dataKey="reorder" fill="#F59E0B44" radius={[0, 4, 4, 0]} maxBarSize={16} name="Reorder Level" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <h2 className="font-semibold text-white mb-4 text-sm">Stock by Category</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} margin={{ left: -20, right: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="stock" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} name="Total Stock" />
                  <Bar dataKey="count" fill="#6366F144" radius={[4, 4, 0, 0]} maxBarSize={40} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
