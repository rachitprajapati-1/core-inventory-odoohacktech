import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Package, Search, Filter, Download, Barcode, RefreshCw, Edit2, Archive } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, StatusBadge, Loader, EmptyState, Pagination } from '../../components/common';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../components/common/BarcodeScanner';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    page: Number(searchParams.get('page')) || 1,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      params.set('page', filters.page);
      params.set('limit', '20');

      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    const cats = async () => {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    };
    cats();
  }, []);

  useEffect(() => {
    window.addEventListener('stock:updated', fetchProducts);
    return () => window.removeEventListener('stock:updated', fetchProducts);
  }, [fetchProducts]);

  const handleFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const handleBarcodeResult = async (barcode) => {
    setShowScanner(false);
    setFilters(f => ({ ...f, search: barcode, page: 1 }));
  };

  const exportExcel = async () => {
    try {
      const res = await api.get('/export/products/excel', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `products_${Date.now()}.xlsx`; a.click();
      toast.success('Excel exported!');
    } catch { toast.error('Export failed'); }
  };

  const exportPDF = async () => {
    try {
      const res = await api.get('/export/products/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `inventory_${Date.now()}.pdf`; a.click();
      toast.success('PDF exported!');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle={`${total} total products`}
        actions={
          <>
            <button onClick={() => setShowScanner(true)} className="btn-secondary">
              <Barcode size={15} /> Scan
            </button>
            <button onClick={exportExcel} className="btn-secondary">
              <Download size={15} /> Excel
            </button>
            <button onClick={exportPDF} className="btn-secondary">
              <Download size={15} /> PDF
            </button>
            <Link to="/products/new" className="btn-primary">
              <Plus size={15} /> Add Product
            </Link>
          </>
        }
      />

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={filters.search} onChange={e => handleFilter('search', e.target.value)} placeholder="Search name, SKU, barcode..." className="input pl-9 h-9" />
        </div>
        <select value={filters.category} onChange={e => handleFilter('category', e.target.value)} className="input h-9 w-44 bg-surface-card">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => handleFilter('status', e.target.value)} className="input h-9 w-40 bg-surface-card">
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <button onClick={fetchProducts} className="btn-secondary h-9 px-3"><RefreshCw size={14} /></button>
      </div>

      {/* Table */}
      {loading ? <Loader /> : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found"
          description="Add your first product to get started"
          action={<Link to="/products/new" className="btn-primary"><Plus size={14} /> Add Product</Link>} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border">
                <tr>
                  {['SKU', 'Product', 'Category', 'Stock', 'Status', 'Reorder', 'Cost', 'Sell Price', ''].map(h => (
                    <th key={h} className="table-head text-left px-4 py-3 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-surface-border/20 transition-colors group">
                    <td className="table-cell font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="table-cell">
                      <div className="font-medium text-slate-200">{p.name}</div>
                      {p.supplier && <div className="text-xs text-slate-500">{p.supplier}</div>}
                    </td>
                    <td className="table-cell">
                      {p.category ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${p.category.color}20`, color: p.category.color }}>
                          {p.category.name}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="table-cell font-semibold text-white font-mono">{p.totalStock} <span className="text-slate-500 text-xs font-normal">{p.unit}</span></td>
                    <td className="table-cell"><StatusBadge status={p.stockStatus} /></td>
                    <td className="table-cell text-slate-400 font-mono text-xs">{p.reorderLevel}</td>
                    <td className="table-cell text-slate-400">₹{p.costPrice?.toLocaleString()}</td>
                    <td className="table-cell text-slate-300">₹{p.sellingPrice?.toLocaleString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/products/${p._id}/edit`} className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-border rounded-lg transition-all">
                          <Edit2 size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={filters.page} pages={pages} onPage={p => setFilters(f => ({ ...f, page: p }))} />

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner onResult={handleBarcodeResult} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
