import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Modal, EmptyState, Loader } from '../../components/common';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get('/categories'); setCategories(data.categories); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', color: '#6366f1' }); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '', color: c.color || '#6366f1' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/categories/${editing._id}`, form);
      else await api.post('/categories', form);
      toast.success(editing ? 'Updated!' : 'Created!');
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organize products by category"
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Category</button>} />

      {loading ? <Loader /> : categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" description="Create categories to organize your products"
          action={<button onClick={openCreate} className="btn-primary"><Plus size={14} /> Add Category</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c._id} className="card flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${c.color}20`, border: `1px solid ${c.color}40` }}>
                <Tag size={16} style={{ color: c.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{c.name}</div>
                {c.description && <div className="text-xs text-slate-500 truncate">{c.description}</div>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-border rounded-lg transition-all"><Edit2 size={13} /></button>
                <button onClick={() => del(c._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'New Category'} size="sm">
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" placeholder="e.g. Raw Materials" /></div>
          <div><label className="label">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Optional" /></div>
          <div><label className="label">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map(col => (
                <button key={col} type="button" onClick={() => setForm(f => ({ ...f, color: col }))}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${form.color === col ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ background: col }} />
              ))}
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border border-surface-border" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
