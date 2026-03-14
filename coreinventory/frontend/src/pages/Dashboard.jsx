import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, XCircle, Inbox, Truck, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { StatCard, Loader, Table } from '../components/common';
import { formatDistanceToNow } from 'date-fns';

const MOVEMENT_COLORS = { receipt: '#10B981', delivery: '#EF4444', transfer_in: '#6366F1', transfer_out: '#8B5CF6', adjustment: '#F59E0B' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get('/dashboard/stats');
      setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('stock:updated', fetchData);
    return () => window.removeEventListener('stock:updated', fetchData);
  }, [fetchData]);

  if (loading) return <Loader text="Loading dashboard..." />;

  // Process chart data
  const chartMap = {};
  (data?.movementData || []).forEach(({ _id, total }) => {
    if (!chartMap[_id.date]) chartMap[_id.date] = { date: _id.date };
    chartMap[_id.date][_id.type] = total;
  });
  const chartData = Object.values(chartMap).slice(-7);
  const pieData = (data?.categoryDist || []).map(c => ({ name: c.name, value: c.count }));

  const typeLabel = { receipt: 'Receipt', delivery: 'Delivery', transfer_in: 'Transfer In', transfer_out: 'Transfer Out', adjustment: 'Adjustment', initial: 'Initial' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time inventory snapshot</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Products" value={data?.stats.totalProducts} icon={Package} color="primary" onClick={() => navigate('/products')} />
        <StatCard label="Low Stock" value={data?.stats.lowStock} icon={AlertTriangle} color="amber" onClick={() => navigate('/products?status=low_stock')} />
        <StatCard label="Out of Stock" value={data?.stats.outOfStock} icon={XCircle} color="red" onClick={() => navigate('/products?status=out_of_stock')} />
        <StatCard label="Pending Receipts" value={data?.stats.pendingReceipts} icon={Inbox} color="blue" onClick={() => navigate('/receipts?status=ready')} />
        <StatCard label="Pending Deliveries" value={data?.stats.pendingDeliveries} icon={Truck} color="emerald" onClick={() => navigate('/deliveries?status=ready')} />
        <StatCard label="Scheduled Transfers" value={data?.stats.scheduledTransfers} icon={ArrowLeftRight} color="primary" onClick={() => navigate('/transfers')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Movement chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">Stock Movements — Last 7 Days</h2>
            <TrendingUp size={16} className="text-slate-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {['receipt', 'delivery', 'adjustment'].map(k => (
                <Bar key={k} dataKey={k} stackId="a" fill={MOVEMENT_COLORS[k]} radius={k === 'adjustment' ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={40} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {['receipt', 'delivery', 'adjustment'].map(k => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: MOVEMENT_COLORS[k] }} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Category pie */}
        <div className="card">
          <h2 className="font-semibold text-white text-sm mb-4">Products by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-16">No data yet</p>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent movements */}
        <div className="card">
          <h2 className="font-semibold text-white text-sm mb-4">Recent Movements</h2>
          <div className="space-y-2">
            {(data?.recentMovements || []).slice(0, 8).map(m => (
              <div key={m._id} className="flex items-center gap-3 py-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0`}
                  style={{ background: MOVEMENT_COLORS[m.type] || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-300 truncate block">{m.product?.name || '—'}</span>
                  <span className="text-xs text-slate-500 font-mono">{m.reference}</span>
                </div>
                <div className={`text-sm font-medium font-mono ${m.quantity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.quantity >= 0 ? '+' : ''}{m.quantity}
                </div>
                <div className="text-xs text-slate-600 text-right w-20 flex-shrink-0">
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
            {!data?.recentMovements?.length && <p className="text-slate-500 text-sm text-center py-6">No movements yet</p>}
          </div>
        </div>

        {/* Top products */}
        <div className="card">
          <h2 className="font-semibold text-white text-sm mb-4">Top Products by Stock</h2>
          <div className="space-y-3">
            {(data?.topProducts || []).map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-primary-600/20 text-primary-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white text-right">{p.totalStock} <span className="text-slate-500 text-xs">{p.unit}</span></div>
                  <div className="text-xs text-right" style={{ color: p.category?.color || '#6366f1' }}>{p.category?.name || '—'}</div>
                </div>
              </div>
            ))}
            {!data?.topProducts?.length && <p className="text-slate-500 text-sm text-center py-6">No products yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
