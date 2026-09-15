import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import BarcodeTag from '../../components/BarcodeTag';
import CameraScanner from '../../components/CameraScanner';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  MinusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Book, 
  PenTool,
  RefreshCw,
  Camera,
  Barcode
} from 'lucide-react';

export default function InventoryTab() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    barcode_isbn: '',
    title: '',
    author_brand: '',
    category: 'Book',
    sub_category: '',
    price: '',
    cost_price: '',
    stock_quantity: 10,
    low_stock_threshold: 5,
    supplier_id: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Camera barcode scanner (for adding products)
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Barcode detail viewer modal
  const [barcodeViewProduct, setBarcodeViewProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (status !== 'all') params.append('status', status);
      if (supplierFilter) params.append('supplier_id', supplierFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [category, status, supplierFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      barcode_isbn: '',
      title: '',
      author_brand: '',
      category: 'Book',
      sub_category: '',
      price: '',
      cost_price: '',
      stock_quantity: 10,
      low_stock_threshold: 5,
      supplier_id: suppliers.length > 0 ? suppliers[0].id : ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      barcode_isbn: prod.barcode_isbn,
      title: prod.title,
      author_brand: prod.author_brand || '',
      category: prod.category,
      sub_category: prod.sub_category || '',
      price: prod.price,
      cost_price: prod.cost_price,
      stock_quantity: prod.stock_quantity,
      low_stock_threshold: prod.low_stock_threshold,
      supplier_id: prod.supplier_id || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (prodId, delta) => {
    try {
      const res = await fetch(`/api/products/${prodId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      if (res.ok) {
        const { product: updated } = await res.json();
        setProducts(prev => prev.map(p => p.id === prodId ? updated : p));
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete product');
        return;
      }
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Stock & Inventory Management</h2>
          <p>Maintain catalog records, barcode registry, stock adjustments, and supplier links</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, ISBN, author, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-group">
          {/* Category Filter */}
          <select 
            className="select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Book">Books Only</option>
            <option value="Stationery">Stationery Only</option>
          </select>

          {/* Stock Status Filter */}
          <select 
            className="select-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; Threshold)</option>
            <option value="low_stock">Low Stock (≤ Threshold)</option>
            <option value="out_of_stock">Out of Stock (0 Units)</option>
          </select>

          {/* Supplier Filter */}
          <select 
            className="select-input"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button className="btn btn-secondary btn-sm" onClick={fetchProducts} title="Refresh catalog">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item / Title</th>
              <th>Category</th>
              <th>Barcode / ISBN</th>
              <th>Retail Price</th>
              <th>Cost Price</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th>Supplier</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading catalog inventory...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No inventory items match your current filter criteria.
                </td>
              </tr>
            ) : (
              products.map(prod => {
                const isOutOfStock = prod.stock_quantity <= 0;
                const isLowStock = prod.stock_quantity > 0 && prod.stock_quantity <= prod.low_stock_threshold;

                return (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.title}</div>
                      {prod.author_brand && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {prod.author_brand} {prod.sub_category ? `• ${prod.sub_category}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${prod.category === 'Book' ? 'badge-book' : 'badge-stationery'}`}>
                        {prod.category === 'Book' ? <Book size={12} /> : <PenTool size={12} />}
                        <span>{prod.category}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                        <BarcodeRenderer 
                          value={prod.barcode_isbn} 
                          width={115} 
                          height={24} 
                          showText={true} 
                          interactive={true} 
                          onClick={() => setBarcodeViewProduct(prod)} 
                        />
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                        ₹{Number(prod.price).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        ₹{Number(prod.cost_price).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <div className="stock-adjust-cell">
                        <div className="stock-btn-group">
                          <button 
                            className="stock-btn" 
                            onClick={() => handleAdjustStock(prod.id, -1)}
                            disabled={prod.stock_quantity <= 0}
                            title="Decrease 1"
                          >
                            -
                          </button>
                          <span className="stock-qty-display">{prod.stock_quantity}</span>
                          <button 
                            className="stock-btn" 
                            onClick={() => handleAdjustStock(prod.id, 1)}
                            title="Increase 1"
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                          onClick={() => handleAdjustStock(prod.id, 5)}
                          title="Quick restock +5"
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="badge badge-status-out-of-stock">
                          <span className="pulse-dot" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="badge badge-status-low-stock">
                          <span className="pulse-dot" />
                          <span>Low Stock ({prod.stock_quantity})</span>
                        </span>
                      ) : (
                        <span className="badge badge-status-in-stock">
                          <span>In Stock</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {prod.supplier_name || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon-only"
                          onClick={() => setBarcodeViewProduct(prod)}
                          title="View Barcode"
                        >
                          <Barcode size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon-only"
                          onClick={() => handleOpenEdit(prod)}
                          title="Edit Item"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon-only"
                          onClick={() => setDeletingProduct(prod)}
                          title="Delete Item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Catalog Product' : 'Add New Inventory Item'}
        maxWidth="600px"
      >
        {formError && (
          <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                className="select-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="Book">Book</option>
                <option value="Stationery">Stationery</option>
              </select>
            </div>

            <div className="form-group">
              <label>Barcode / ISBN *</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. 9780143034902"
                  value={formData.barcode_isbn}
                  onChange={(e) => setFormData({ ...formData, barcode_isbn: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsScannerOpen(true)}
                  title="Scan barcode with camera"
                  style={{ flexShrink: 0, gap: '0.35rem' }}
                >
                  <Camera size={15} />
                  Scan
                </button>
              </div>
              {/* Live barcode preview */}
              {formData.barcode_isbn && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Barcode Preview</div>
                  <BarcodeRenderer value={formData.barcode_isbn} height={48} showText={true} />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Item Title / Book Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. The Shadow of the Wind"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Author / Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Carlos Ruiz Zafón or Moleskine"
                value={formData.author_brand}
                onChange={(e) => setFormData({ ...formData, author_brand: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Sub-Category / Genre</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Gothic Fiction, Fountain Pens"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Retail Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="199.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Cost Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="120.00"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Assigned Supplier</label>
            <select
              className="select-input"
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            >
              <option value="">No Supplier Assigned</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving Item...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Confirm Item Deletion"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Are you sure you want to remove <strong>"{deletingProduct?.title}"</strong> from inventory?
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeletingProduct(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Product
          </button>
        </div>
      </Modal>

      {/* Camera Scanner for barcode entry in Add/Edit form */}
      <CameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onDetected={(code) => {
          setFormData(prev => ({ ...prev, barcode_isbn: code }));
        }}
      />

      {/* Barcode Detail Viewer Modal */}
      <Modal
        isOpen={!!barcodeViewProduct}
        onClose={() => setBarcodeViewProduct(null)}
        title="Product Barcode"
        maxWidth="360px"
      >
        {barcodeViewProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{barcodeViewProduct.title}</div>
              {barcodeViewProduct.author_brand && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{barcodeViewProduct.author_brand}</div>
              )}
            </div>
            <div style={{
              padding: '1.5rem 2rem',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <BarcodeRenderer value={barcodeViewProduct.barcode_isbn} height={72} showText={true} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {barcodeViewProduct.category} • ₹{Number(barcodeViewProduct.price).toFixed(2)}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setBarcodeViewProduct(null)}
              style={{ alignSelf: 'stretch' }}
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
