import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Package } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, StatusBadge, Loader } from '../../components/common';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/receipts/${id}`); setReceipt(data.receipt); }
    catch { toast.error('Failed to load receipt'); navigate('/receipts'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [id]);

  const validate = async () => {
    if (!confirm('Validate receipt? This will increase stock levels.')) return;
    setActioning(true);
    try { await api.post(`/receipts/${id}/validate`); toast.success('Receipt validated! Stock updated.'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setActioning(false); }
  };

  const cancel = async () => {
    if (!confirm('Cancel this receipt?')) return;
    setActioning(true);
    try { await api.post(`/receipts/${id}/cancel`); toast.success('Receipt canceled'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setActioning(false); }
  };

  if (loading) return <Loader />;
  if (!receipt) return null;

  const canAct = user?.role !== 'staff' && receipt.status !== 'done' && receipt.status !== 'canceled';

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={receipt.reference}
        subtitle={`Receipt from ${receipt.supplier}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/receipts')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>
            {canAct && <Link to={`/receipts/${id}/edit`} className="btn-secondary"><Edit2 size={14} /> Edit</Link>}
            {canAct && <button onClick={validate} disabled={actioning} className="btn-success"><CheckCircle size={15} /> Validate</button>}
            {canAct && <button onClick={cancel} disabled={actioning} className="btn-danger"><XCircle size={15} /> Cancel</button>}
          </div>
        }
      />

      <div className="space-y-4">
        {/* Header info */}
        <div className="card grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: <StatusBadge status={receipt.status} /> },
            { label: 'Warehouse', value: receipt.warehouse?.name || '—' },
            { label: 'Scheduled Date', value: receipt.scheduledDate ? format(new Date(receipt.scheduledDate), 'dd MMM yyyy') : '—' },
            { label: 'Supplier Ref', value: receipt.supplierRef || '—' },
            { label: 'Created By', value: receipt.createdBy?.name || '—' },
            { label: 'Created At', value: format(new Date(receipt.createdAt), 'dd MMM yyyy, HH:mm') },
            receipt.validatedBy && { label: 'Validated By', value: receipt.validatedBy?.name },
            receipt.validatedAt && { label: 'Validated At', value: format(new Date(receipt.validatedAt), 'dd MMM yyyy, HH:mm') },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label}><p className="label">{label}</p><p className="text-slate-200 text-sm">{value}</p></div>
          ))}
        </div>

        {/* Lines table */}
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-surface-border">
            <h3 className="font-semibold text-white text-sm">Product Lines</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>{['Product', 'SKU', 'Expected', 'Received', 'Unit', 'Status'].map(h => <th key={h} className="table-head text-left px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {receipt.lines.map((line, i) => (
                  <tr key={i} className="hover:bg-surface-border/20 transition-colors">
                    <td className="table-cell font-medium text-slate-200">{line.product?.name || '—'}</td>
                    <td className="table-cell font-mono text-xs text-slate-400">{line.product?.sku}</td>
                    <td className="table-cell font-mono">{line.expectedQty}</td>
                    <td className="table-cell font-mono text-emerald-400">{line.receivedQty}</td>
                    <td className="table-cell text-slate-400">{line.unit}</td>
                    <td className="table-cell">
                      {line.receivedQty >= line.expectedQty ? (
                        <span className="status-badge badge-done">Complete</span>
                      ) : line.receivedQty > 0 ? (
                        <span className="status-badge badge-waiting">Partial</span>
                      ) : (
                        <span className="status-badge badge-draft">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {receipt.notes && (
          <div className="card"><p className="label">Notes</p><p className="text-slate-300 text-sm">{receipt.notes}</p></div>
        )}
      </div>
    </div>
  );
}
