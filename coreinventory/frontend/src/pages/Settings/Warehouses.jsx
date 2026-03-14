import { useState, useEffect } from 'react';
import { Plus, Warehouse, Edit2, Trash2, MapPin } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Modal, EmptyState, Loader } from '../../components/common';
import toast from 'react-hot-toast';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get('/warehouses'); setWarehouses(data.warehouses); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', address: '', city: '' }); setModal(true); };
  const openEdit = w => { setEditing(w); setForm({ name: w.name, code: w.code, address: w.address || '', city: w.city || '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/warehouses/${editing._id}`, form);
      else await api.post('/warehouses', form);
      toast.success(editing ? 'Updated!' : 'Warehouse created!');
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Deactivate this warehouse?')) return;
    try { await api.delete(`/warehouses/${id}`); toast.success('Deactivated'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Manage storage locations"
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Warehouse</button>} />

      {loading ? <Loader /> : warehouses.length === 0 ? (
        <EmptyState icon={Warehouse} title="No warehouses yet" description="Create at least one warehouse to start tracking stock"
          action={<button onClick={openCreate} className="btn-primary"><Plus size={14} /> Add Warehouse</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <div key={w._id} className="card group space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Warehouse size={18} className="text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{w.name}</h3>
                    <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">{w.code}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(w)} className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-border rounded-lg"><Edit2 size={13} /></button>
                  <button onClick={() => del(w._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={13} /></button>
                </div>
              </div>
              {(w.address || w.city) && (
                <div className="flex items-start gap-2 text-slate-500 text-xs">
                  <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{[w.address, w.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {w.locations?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {w.locations.slice(0, 5).map((loc, i) => (
                    <span key={i} className="text-xs bg-surface-border px-2 py-0.5 rounded text-slate-400">{loc.name}</span>
                  ))}
                  {w.locations.length > 5 && <span className="text-xs text-slate-600">+{w.locations.length - 5} more</span>}
                </div>
              )}
              <div className="text-xs text-slate-600">{w.locations?.length || 0} sub-locations</div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Warehouse' : 'New Warehouse'} size="sm">
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" placeholder="Main Warehouse" /></div>
          <div><label className="label">Code *</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required className="input font-mono" placeholder="WH-001" /></div>
          <div><label className="label">Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input" placeholder="Street address" /></div>
          <div><label className="label">City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input" placeholder="City" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
