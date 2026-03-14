import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function AdjustmentForm() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const isEdit = !!id;
  const [warehouses, setWarehouses] = useState([]); const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false); const [validating, setValidating] = useState(false);
  const [adjId, setAdjId] = useState(id || null);
  const [form, setForm] = useState({ warehouse: '', reason: '', status: 'draft', lines: [] });

  useEffect(() => {
    const load = async () => {
      const [whs, prods] = await Promise.all([api.get('/warehouses'), api.get('/products?limit=500')]);
      setWarehouses(whs.data.warehouses); setProducts(prods.data.products);
    }; load();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await api.get(`/adjustments/${id}`); const a = data.adjustment;
      setForm({ warehouse: a.warehouse?._id || '', reason: a.reason || '', status: a.status,
        lines: a.lines.map(l => ({ product: l.product?._id || l.product, location: l.location || 'Main', theoreticalQty: l.theoreticalQty, countedQty: l.countedQty, unit: l.unit })) });
    }; load();
  }, [id, isEdit]);

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { product: '', location: 'Main', theoreticalQty: 0, countedQty: 0, unit: 'pcs' }] }));
  const removeLine = i => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, k, v) => setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l) }));

  const lineProductChange = async (i, pid) => {
    const p = products.find(x => x._id === pid);
    updateLine(i, 'product', pid);
    if (p) { updateLine(i, 'unit', p.unit); updateLine(i, 'theoreticalQty', p.totalStock); updateLine(i, 'countedQty', p.totalStock); }
  };

  const save = async (e, andValidate = false) => {
    e?.preventDefault();
    if (!form.lines.length) { toast.error('Add at least one product'); return; }
    setSaving(true);
    try {
      let savedId = adjId;
      if (isEdit || savedId) { await api.put(`/adjustments/${savedId}`, form); }
      else { const { data } = await api.post('/adjustments', form); savedId = data.adjustment._id; setAdjId(savedId); }

      if (andValidate) {
        setValidating(true);
        await api.post(`/adjustments/${savedId}/validate`);
        toast.success('Adjustment validated! Stock updated.');
        navigate('/adjustments');
      } else {
        toast.success(isEdit ? 'Updated!' : 'Saved!');
        if (!isEdit) navigate(`/adjustments/${savedId}/edit`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); setValidating(false); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? 'Edit Adjustment' : 'New Stock Adjustment'} subtitle="Fix stock discrepancies between records and physical count"
        actions={<button onClick={() => navigate('/adjustments')} className="btn-secondary"><ArrowLeft size={15} /> Back</button>} />

      <form onSubmit={save} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Adjustment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Warehouse *</label>
              <select value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} required className="input bg-surface-card">
                <option value="">Select warehouse...</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div><label className="label">Reason</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="input" placeholder="Physical count, damage, shrinkage..." />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="font-semibold text-white text-sm">Count Lines</h3>
            <button type="button" onClick={addLine} className="btn-primary py-1.5 text-xs"><Plus size={13} /> Add Product</button>
          </div>

          {form.lines.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">Add products to adjust their stock quantities.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left pb-2 pr-2">Product</th>
                    <th className="text-left pb-2 px-2 w-24">Theoretical</th>
                    <th className="text-left pb-2 px-2 w-24">Counted *</th>
                    <th className="text-left pb-2 px-2 w-20">Diff</th>
                    <th className="pb-2 w-8"></th>
                  </tr></thead>
                  <tbody className="space-y-1">
                    {form.lines.map((line, i) => {
                      const diff = Number(line.countedQty) - Number(line.theoreticalQty);
                      return (
                        <tr key={i} className="border-t border-surface-border/30">
                          <td className="py-2 pr-2">
                            <select value={line.product} onChange={e => lineProductChange(i, e.target.value)} required className="input bg-surface-card text-sm">
                              <option value="">Select product...</option>
                              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input type="number" min="0" value={line.theoreticalQty} onChange={e => updateLine(i, 'theoreticalQty', Number(e.target.value))} className="input text-sm text-slate-400 w-20" readOnly />
                          </td>
                          <td className="py-2 px-2">
                            <input type="number" min="0" value={line.countedQty} onChange={e => updateLine(i, 'countedQty', Number(e.target.value))} required className="input text-sm w-20" />
                          </td>
                          <td className="py-2 px-2">
                            <span className={`font-mono font-semibold text-sm ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeLine(i)} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/adjustments')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving || validating} className="btn-secondary">
            {saving && !validating ? <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            Save Draft
          </button>
          {user?.role !== 'staff' && (
            <button type="button" onClick={() => save(null, true)} disabled={saving || validating} className="btn-success">
              {validating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={15} />}
              Validate & Apply
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
