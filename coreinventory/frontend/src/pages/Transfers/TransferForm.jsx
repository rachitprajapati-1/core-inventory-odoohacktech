import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

export default function TransferForm() {
  const { id } = useParams(); const navigate = useNavigate(); const isEdit = !!id;
  const [warehouses, setWarehouses] = useState([]); const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fromWarehouse: '', fromLocation: 'Main', toWarehouse: '', toLocation: 'Main',
    scheduledDate: '', reason: '', notes: '', status: 'draft', lines: []
  });

  useEffect(() => {
    const load = async () => {
      const [whs, prods] = await Promise.all([api.get('/warehouses'), api.get('/products?limit=500')]);
      setWarehouses(whs.data.warehouses); setProducts(prods.data.products);
    }; load();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await api.get(`/transfers/${id}`); const t = data.transfer;
      setForm({
        fromWarehouse: t.fromWarehouse?._id || '', fromLocation: t.fromLocation || 'Main',
        toWarehouse: t.toWarehouse?._id || '', toLocation: t.toLocation || 'Main',
        scheduledDate: t.scheduledDate ? t.scheduledDate.split('T')[0] : '',
        reason: t.reason || '', notes: t.notes || '', status: t.status,
        lines: t.lines.map(l => ({ product: l.product?._id || l.product, quantity: l.quantity, unit: l.unit }))
      });
    }; load();
  }, [id, isEdit]);

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { product: '', quantity: 1, unit: 'pcs' }] }));
  const removeLine = i => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, k, v) => setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l) }));
  const lineProductChange = (i, pid) => {
    const p = products.find(x => x._id === pid);
    updateLine(i, 'product', pid);
    if (p) updateLine(i, 'unit', p.unit);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.fromWarehouse === form.toWarehouse) { toast.error('Source and destination cannot be the same'); return; }
    if (!form.lines.length) { toast.error('Add at least one product'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.put(`/transfers/${id}`, form);
      else await api.post('/transfers', form);
      toast.success(isEdit ? 'Updated!' : 'Transfer created!');
      navigate('/transfers');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? 'Edit Transfer' : 'New Internal Transfer'} subtitle="Move stock between warehouses or locations"
        actions={<button onClick={() => navigate('/transfers')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>} />
      <form onSubmit={submit} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Transfer Route</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            <div className="sm:col-span-2">
              <label className="label">From Warehouse *</label>
              <select value={form.fromWarehouse} onChange={e => setForm(f => ({ ...f, fromWarehouse: e.target.value }))} required className="input bg-surface-card">
                <option value="">Select...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div className="hidden sm:flex items-center justify-center pt-5">
              <ArrowRight size={20} className="text-primary-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">To Warehouse *</label>
              <select value={form.toWarehouse} onChange={e => setForm(f => ({ ...f, toWarehouse: e.target.value }))} required className="input bg-surface-card">
                <option value="">Select...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className="label">From Location</label>
              <input value={form.fromLocation} onChange={e => setForm(f => ({ ...f, fromLocation: e.target.value }))} className="input" placeholder="Main" />
            </div>
            <div className="hidden sm:block" />
            <div>
              <label className="label">To Location</label>
              <input value={form.toLocation} onChange={e => setForm(f => ({ ...f, toLocation: e.target.value }))} className="input" placeholder="Main" />
            </div>
            <div>
              <label className="label">Scheduled Date</label>
              <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Reason</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="input" placeholder="Relocation, production..." />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="font-semibold text-white text-sm">Products to Transfer</h3>
            <button type="button" onClick={addLine} className="btn-primary py-1.5 text-xs"><Plus size={13} /> Add Line</button>
          </div>
          {form.lines.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">No lines added yet.</div>
            : form.lines.map((line, i) => (
              <div key={i} className="bg-surface-border/30 rounded-lg p-3 grid grid-cols-12 gap-3 items-start">
                <div className="col-span-7">
                  <label className="label">Product *</label>
                  <select value={line.product} onChange={e => lineProductChange(i, e.target.value)} required className="input bg-surface-card text-sm">
                    <option value="">Select...</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — {p.totalStock} {p.unit}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">Quantity</label><input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="input text-sm" /></div>
                <div className="col-span-2"><label className="label">Unit</label><input value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)} className="input text-sm" /></div>
                <div className="col-span-1 pt-5"><button type="button" onClick={() => removeLine(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
            ))}
        </div>

        <div className="card"><label className="label">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input resize-none" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/transfers')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : isEdit ? 'Update Transfer' : 'Create Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}
