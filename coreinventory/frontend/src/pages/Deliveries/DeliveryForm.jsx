// DeliveryForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

export default function DeliveryForm() {
  const { id } = useParams(); const navigate = useNavigate(); const isEdit = !!id;
  const [warehouses, setWarehouses] = useState([]); const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer: '', customerRef: '', warehouse: '', scheduledDate: '', shippingAddress: '', notes: '', status: 'draft', lines: [] });

  useEffect(() => {
    const load = async () => {
      const [whs, prods] = await Promise.all([api.get('/warehouses'), api.get('/products?limit=500')]);
      setWarehouses(whs.data.warehouses); setProducts(prods.data.products);
    }; load();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await api.get(`/deliveries/${id}`); const d = data.delivery;
      setForm({ customer: d.customer, customerRef: d.customerRef || '', warehouse: d.warehouse?._id || '', scheduledDate: d.scheduledDate ? d.scheduledDate.split('T')[0] : '', shippingAddress: d.shippingAddress || '', notes: d.notes || '', status: d.status, lines: d.lines.map(l => ({ product: l.product?._id || l.product, orderedQty: l.orderedQty, shippedQty: l.shippedQty, unit: l.unit })) });
    }; load();
  }, [id, isEdit]);

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { product: '', orderedQty: 1, shippedQty: 0, unit: 'pcs' }] }));
  const removeLine = i => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, k, v) => setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l) }));
  const lineProductChange = (i, pid) => { const p = products.find(x => x._id === pid); updateLine(i, 'product', pid); if (p) updateLine(i, 'unit', p.unit); };

  const submit = async (e) => {
    e.preventDefault(); if (!form.lines.length) { toast.error('Add at least one product'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.put(`/deliveries/${id}`, form); else await api.post('/deliveries', form);
      toast.success(isEdit ? 'Updated!' : 'Delivery created!'); navigate('/deliveries');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? 'Edit Delivery' : 'New Delivery Order'} subtitle="Outgoing stock to customer"
        actions={<button onClick={() => navigate('/deliveries')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>} />
      <form onSubmit={submit} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Delivery Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Customer *</label><input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} required className="input" placeholder="Customer name" /></div>
            <div><label className="label">Customer Reference</label><input value={form.customerRef} onChange={e => setForm(f => ({ ...f, customerRef: e.target.value }))} className="input" placeholder="Order #" /></div>
            <div><label className="label">Warehouse *</label>
              <select value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} required className="input bg-surface-card">
                <option value="">Select warehouse...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div><label className="label">Scheduled Date</label><input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Shipping Address</label><input value={form.shippingAddress} onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} className="input" placeholder="Delivery address" /></div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="font-semibold text-white text-sm">Product Lines</h3>
            <button type="button" onClick={addLine} className="btn-primary py-1.5 text-xs"><Plus size={13} /> Add Line</button>
          </div>
          {form.lines.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">No lines added yet.</div>
            : form.lines.map((line, i) => (
              <div key={i} className="bg-surface-border/30 rounded-lg p-3 grid grid-cols-12 gap-3 items-start">
                <div className="col-span-6"><label className="label">Product *</label>
                  <select value={line.product} onChange={e => lineProductChange(i, e.target.value)} required className="input bg-surface-card text-sm">
                    <option value="">Select...</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — Stock: {p.totalStock}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">Ordered</label><input type="number" min="0" value={line.orderedQty} onChange={e => updateLine(i, 'orderedQty', Number(e.target.value))} className="input text-sm" /></div>
                <div className="col-span-2"><label className="label">Shipped</label><input type="number" min="0" value={line.shippedQty} onChange={e => updateLine(i, 'shippedQty', Number(e.target.value))} className="input text-sm" /></div>
                <div className="col-span-1"><label className="label">Unit</label><input value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)} className="input text-sm" /></div>
                <div className="col-span-1 pt-5"><button type="button" onClick={() => removeLine(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
            ))}
        </div>

        <div className="card"><label className="label">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input resize-none" /></div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/deliveries')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
}
