import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Edit2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, StatusBadge, Loader } from '../../components/common';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function TransferDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const [transfer, setTransfer] = useState(null); const [loading, setLoading] = useState(true); const [actioning, setActioning] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/transfers/${id}`); setTransfer(data.transfer); }
    catch { toast.error('Failed to load'); navigate('/transfers'); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [id]);

  const validate = async () => {
    if (!confirm('Validate transfer? Stock will be moved between warehouses.')) return;
    setActioning(true);
    try { await api.post(`/transfers/${id}/validate`); toast.success('Transfer validated! Stock moved.'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setActioning(false); }
  };
  const cancel = async () => {
    if (!confirm('Cancel transfer?')) return;
    setActioning(true);
    try { await api.post(`/transfers/${id}/cancel`); toast.success('Canceled'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setActioning(false); }
  };

  if (loading) return <Loader />;
  if (!transfer) return null;
  const canAct = user?.role !== 'staff' && transfer.status !== 'done' && transfer.status !== 'canceled';

  return (
    <div className="max-w-3xl">
      <PageHeader title={transfer.reference} subtitle="Internal Stock Transfer"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/transfers')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>
            {canAct && <Link to={`/transfers/${id}/edit`} className="btn-secondary"><Edit2 size={14} /> Edit</Link>}
            {canAct && <button onClick={validate} disabled={actioning} className="btn-success"><CheckCircle size={15} /> Validate</button>}
            {canAct && <button onClick={cancel} disabled={actioning} className="btn-danger"><XCircle size={15} /> Cancel</button>}
          </div>
        }
      />
      <div className="space-y-4">
        {/* Route display */}
        <div className="card">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <p className="label">From</p>
              <p className="font-semibold text-white">{transfer.fromWarehouse?.name}</p>
              <p className="text-xs text-slate-500">{transfer.fromLocation}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="h-0.5 flex-1 bg-primary-500/30" />
              <ArrowRight size={20} className="text-primary-400 mx-2" />
              <div className="h-0.5 flex-1 bg-primary-500/30" />
            </div>
            <div className="text-center">
              <p className="label">To</p>
              <p className="font-semibold text-white">{transfer.toWarehouse?.name}</p>
              <p className="text-xs text-slate-500">{transfer.toLocation}</p>
            </div>
          </div>
        </div>

        <div className="card grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{ label: 'Status', value: <StatusBadge status={transfer.status} /> },
            { label: 'Scheduled Date', value: transfer.scheduledDate ? format(new Date(transfer.scheduledDate), 'dd MMM yyyy') : '—' },
            { label: 'Reason', value: transfer.reason || '—' },
            { label: 'Created By', value: transfer.createdBy?.name || '—' },
            transfer.validatedBy && { label: 'Validated By', value: transfer.validatedBy?.name },
            transfer.validatedAt && { label: 'Validated At', value: format(new Date(transfer.validatedAt), 'dd MMM yyyy, HH:mm') },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label}><p className="label">{label}</p><p className="text-slate-200 text-sm">{value}</p></div>
          ))}
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-surface-border"><h3 className="font-semibold text-white text-sm">Products</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>{['Product', 'SKU', 'Quantity', 'Unit', 'Available Stock'].map(h => <th key={h} className="table-head text-left px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {transfer.lines.map((line, i) => (
                  <tr key={i} className="hover:bg-surface-border/20 transition-colors">
                    <td className="table-cell font-medium text-slate-200">{line.product?.name || '—'}</td>
                    <td className="table-cell font-mono text-xs text-slate-400">{line.product?.sku}</td>
                    <td className="table-cell font-mono text-primary-400 font-semibold">{line.quantity}</td>
                    <td className="table-cell text-slate-400">{line.unit}</td>
                    <td className="table-cell font-mono text-slate-300">{line.product?.totalStock ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {transfer.notes && <div className="card"><p className="label">Notes</p><p className="text-slate-300 text-sm">{transfer.notes}</p></div>}
      </div>
    </div>
  );
}
