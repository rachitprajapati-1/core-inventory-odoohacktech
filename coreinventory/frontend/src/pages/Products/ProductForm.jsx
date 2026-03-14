import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

const UNITS = ['pcs', 'kg', 'g', 'liter', 'ml', 'box', 'set', 'meter', 'sqm', 'ton'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: '', unit: 'pcs',
    description: '', costPrice: 0, sellingPrice: 0,
    reorderLevel: 10, maxStock: 1000, supplier: '', tags: '',
    initialStock: 0, warehouseId: '',
  });

  useEffect(() => {
    const loadMeta = async () => {
      const [cats, whs] = await Promise.all([api.get('/categories'), api.get('/warehouses')]);
      setCategories(cats.data.categories);
      setWarehouses(whs.data.warehouses);
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.product;
        setForm({
          name: p.name, sku: p.sku, barcode: p.barcode || '', category: p.category?._id || '',
          unit: p.unit, description: p.description || '', costPrice: p.costPrice, sellingPrice: p.sellingPrice,
          reorderLevel: p.reorderLevel, maxStock: p.maxStock, supplier: p.supplier || '',
          tags: (p.tags || []).join(', '), initialStock: 0, warehouseId: '',
        });
      } catch { toast.error('Failed to load product'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, isEdit]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        category: form.category || undefined,       
       };
      if (isEdit) await api.put(`/products/${id}`, payload);
      else await api.post('/products', payload);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        subtitle={isEdit ? `Editing ${form.name}` : 'Add a new product to inventory'}
        actions={
          <button onClick={() => navigate('/products')} className="btn-secondary">
            <ArrowLeft size={15} /> Back
          </button>
        }
      />

      <form onSubmit={submit} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input name="name" value={form.name} onChange={handle} required className="input" placeholder="e.g. Steel Rod 10mm" />
            </div>
            <div>
              <label className="label">SKU / Code *</label>
              <input name="sku" value={form.sku} onChange={handle} required className="input font-mono" placeholder="e.g. STL-ROD-10MM" />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input name="barcode" value={form.barcode} onChange={handle} className="input font-mono" placeholder="EAN / UPC barcode" />
            </div>
            <div>
              <label className="label">Category</label>
              <select name="category" value={form.category} onChange={handle} className="input bg-surface-card">
                <option value="">No Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit of Measure</label>
              <select name="unit" value={form.unit} onChange={handle} className="input bg-surface-card">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handle} rows={2} className="input resize-none" placeholder="Optional description..." />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input name="supplier" value={form.supplier} onChange={handle} className="input" placeholder="Supplier name" />
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={handle} className="input" placeholder="raw-material, metal, ..." />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Pricing & Stock Levels</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Cost Price (₹)</label>
              <input name="costPrice" type="number" min="0" step="0.01" value={form.costPrice} onChange={handle} className="input" />
            </div>
            <div>
              <label className="label">Selling Price (₹)</label>
              <input name="sellingPrice" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={handle} className="input" />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input name="reorderLevel" type="number" min="0" value={form.reorderLevel} onChange={handle} className="input" />
            </div>
            <div>
              <label className="label">Max Stock</label>
              <input name="maxStock" type="number" min="0" value={form.maxStock} onChange={handle} className="input" />
            </div>
          </div>
        </div>

        {!isEdit && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3">Initial Stock (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Initial Quantity</label>
                <input name="initialStock" type="number" min="0" value={form.initialStock} onChange={handle} className="input" placeholder="0" />
              </div>
              <div>
                <label className="label">Warehouse</label>
                <select name="warehouseId" value={form.warehouseId} onChange={handle} className="input bg-surface-card">
                  <option value="">Select warehouse...</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
