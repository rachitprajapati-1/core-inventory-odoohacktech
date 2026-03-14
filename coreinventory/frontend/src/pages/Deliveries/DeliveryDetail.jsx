import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Package2 } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, StatusBadge, Loader } from '../../components/common';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const [delivery, setDelivery] = useState(null); const [loading, setLoading] = useState(true); const [actioning, setActioning] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/deliveries/${id}`); setDelivery(data.delivery); }
    catch { toast.error('Failed to load'); navigate('/deliveries'); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [id]);

  const validate = async () => {
    if (!confirm('Validate delivery? This will decrease stock levels.')) return;
    setActioning(true);
    try { await api.post(`/deliveries/${id}/validate`); toast.success('Delivery validated! Stock updated.'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setActioning(false); }
  };
  const cancel = async () => {
    if (!confirm('Cancel delivery?')) return;
    setActioning(true);
    try { await api.post(`/deliveries/${id}/cancel`); toast.success('Canceled'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setActioning(false); }
  };

  if (loading) return <Loader />;
  if (!delivery) return null;
  const canAct = user?.role !== 'staff' && delivery.status !== 'done' && delivery.status !== 'canceled';

  return (
    <div className="max-w-3xl">
      <PageHeader title={delivery.reference} subtitle={`Delivery to ${delivery.customer}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/deliveries')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>
            {canAct && <Link to={`/deliveries/${id}/edit`} className="btn-secondary"><Edit2 size={14} /> Edit</Link>}
            {canAct && <button onClick={validate} disabled={actioning} className="btn-success"><CheckCircle size={15} /> Validate</button>}
            {canAct && <button onClick={cancel} disabled={actioning} className="btn-danger"><XCircle size={15} /> Cancel</button>}
          </div>
        }
      />
      <div className="space-y-4">
        <div className="card grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{ label: 'Status', value: <StatusBadge status={delivery.status} /> },
            { label: 'Warehouse', value: delivery.warehouse?.name || '—' },
            { label: 'Scheduled Date', value: delivery.scheduledDate ? format(new Date(delivery.scheduledDate), 'dd MMM yyyy') : '—' },
            { label: 'Customer Ref', value: delivery.customerRef || '—' },
            { label: 'Shipping Address', value: delivery.shippingAddress || '—' },
            { label: 'Created By', value: delivery.createdBy?.name || '—' },
          ].map(({ label, value }) => (
            <div key={label}><p className="label">{label}</p><p className="text-slate-200 text-sm">{value}</p></div>
          ))}
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-surface-border"><h3 className="font-semibold text-white text-sm">Product Lines</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>{['Product', 'SKU', 'Ordered', 'Shipped', 'Unit', 'Current Stock'].map(h => <th key={h} className="table-head text-left px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {delivery.lines.map((line, i) => (
                  <tr key={i} className="hover:bg-surface-border/20 transition-colors">
                    <td className="table-cell font-medium text-slate-200">{line.product?.name || '—'}</td>
                    <td className="table-cell font-mono text-xs text-slate-400">{line.product?.sku}</td>
                    <td className="table-cell font-mono">{line.orderedQty}</td>
                    <td className="table-cell font-mono text-emerald-400">{line.shippedQty}</td>
                    <td className="table-cell text-slate-400">{line.unit}</td>
                    <td className={`table-cell font-mono font-semibold ${line.product?.totalStock < line.orderedQty ? 'text-red-400' : 'text-emerald-400'}`}>{line.product?.totalStock ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {delivery.notes && <div className="card"><p className="label">Notes</p><p className="text-slate-300 text-sm">{delivery.notes}</p></div>}
      </div>
    </div>
  );
}
