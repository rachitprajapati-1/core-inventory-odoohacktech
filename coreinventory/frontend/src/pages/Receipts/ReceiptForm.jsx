import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

export default function ReceiptForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplier: '', supplierRef: '', warehouse: '', scheduledDate: '', notes: '', status: 'draft', lines: [] });

  useEffect(() => {
    const load = async () => {
      const [whs, prods] = await Promise.all([api.get('/warehouses'), api.get('/products?limit=500')]);
      setWarehouses(whs.data.warehouses);
      setProducts(prods.data.products);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await api.get(`/receipts/${id}`);
      const r = data.receipt;
      setForm({ supplier: r.supplier, supplierRef: r.supplierRef || '', warehouse: r.warehouse?._id || '', scheduledDate: r.scheduledDate ? r.scheduledDate.split('T')[0] : '', notes: r.notes || '', status: r.status, lines: r.lines.map(l => ({ product: l.product?._id || l.product, expectedQty: l.expectedQty, receivedQty: l.receivedQty, unit: l.unit, notes: l.notes || '' })) });
    };
    load();
  }, [id, isEdit]);

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { product: '', expectedQty: 1, receivedQty: 0, unit: 'pcs', notes: '' }] }));
  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, key, val) => setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [key]: val } : l) }));
  const lineProductChange = (i, pid) => {
    const p = products.find(x => x._id === pid);
    updateLine(i, 'product', pid);
    if (p) updateLine(i, 'unit', p.unit);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.lines.length) { toast.error('Add at least one product line'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.put(`/receipts/${id}`, form);
      else await api.post('/receipts', form);
      toast.success(isEdit ? 'Receipt updated!' : 'Receipt created!');
      navigate('/receipts');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? 'Edit Receipt' : 'New Receipt'} subtitle="Incoming stock from vendor"
        actions={<button onClick={() => navigate('/receipts')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>} />

      <form onSubmit={submit} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Receipt Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Supplier *</label><input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} required className="input" placeholder="Vendor name" /></div>
            <div><label className="label">Supplier Reference</label><input value={form.supplierRef} onChange={e => setForm(f => ({ ...f, supplierRef: e.target.value }))} className="input" placeholder="PO / Invoice #" /></div>
            <div><label className="label">Warehouse *</label>
              <select value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} required className="input bg-surface-card">
                <option value="">Select warehouse...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div><label className="label">Scheduled Date</label><input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input bg-surface-card w-40">
                {['draft', 'waiting', 'ready'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="font-semibold text-white text-sm">Product Lines</h3>
            <button type="button" onClick={addLine} className="btn-primary py-1.5 text-xs"><Plus size={13} /> Add Line</button>
          </div>
          {form.lines.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No lines added yet. Click "Add Line" to start.</div>
          ) : form.lines.map((line, i) => (
            <div key={i} className="bg-surface-border/30 rounded-lg p-3 grid grid-cols-12 gap-3 items-start">
              <div className="col-span-5">
                <label className="label">Product *</label>
                <select value={line.product} onChange={e => lineProductChange(i, e.target.value)} required className="input bg-surface-card text-sm">
                  <option value="">Select...</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Expected</label>
                <input type="number" min="0" value={line.expectedQty} onChange={e => updateLine(i, 'expectedQty', Number(e.target.value))} className="input text-sm" />
              </div>
              <div className="col-span-2">
                <label className="label">Received</label>
                <input type="number" min="0" value={line.receivedQty} onChange={e => updateLine(i, 'receivedQty', Number(e.target.value))} className="input text-sm" />
              </div>
              <div className="col-span-2">
                <label className="label">Unit</label>
                <input value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)} className="input text-sm" />
              </div>
              <div className="col-span-1 pt-5">
                <button type="button" onClick={() => removeLine(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input resize-none" placeholder="Optional notes..." />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/receipts')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : isEdit ? 'Update Receipt' : 'Create Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
}
