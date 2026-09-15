import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { Plus, Truck, Phone, Mail, MapPin, Package, Edit3, Trash2, ExternalLink } from 'lucide-react';

export default function SupplierTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    supplied_categories: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // View linked items modal
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [linkedProducts, setLinkedProducts] = useState([]);
  const [loadingLinked, setLoadingLinked] = useState(false);

  // Delete modal
  const [deletingSupplier, setDeletingSupplier] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      supplied_categories: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      supplied_categories: sup.supplied_categories || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenLinked = async (sup) => {
    setViewingSupplier(sup);
    setLoadingLinked(true);
    try {
      const res = await fetch(`/api/suppliers/${sup.id}`);
      if (res.ok) {
        const data = await res.json();
        setLinkedProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching linked products:', err);
    } finally {
      setLoadingLinked(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save supplier');
      }

      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeletingSupplier(null);
        fetchSuppliers();
      }
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Supplier Management</h2>
          <p>Manage publishing houses, stationery manufacturers, distributor contacts, and catalog assignments</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Suppliers Grid Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading supplier network...
        </div>
      ) : suppliers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No suppliers registered yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {suppliers.map(sup => (
            <div key={sup.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'var(--accent-gold-subtle)', 
                      color: 'var(--accent-gold)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Truck size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sup.name}</h4>
                      {sup.contact_person && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Attn: {sup.contact_person}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="badge" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)' }}>
                    <Package size={11} />
                    <span>{sup.product_count} items</span>
                  </span>
                </div>

                {/* Supplied categories tag */}
                {sup.supplied_categories && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', background: 'var(--accent-gold-subtle)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                      {sup.supplied_categories}
                    </span>
                  </div>
                )}

                {/* Contact Information */}
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  {sup.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={13} color="var(--text-muted)" />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                  {sup.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={13} color="var(--text-muted)" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={13} color="var(--text-muted)" />
                      <span>{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenLinked(sup)}
                >
                  <ExternalLink size={13} />
                  <span>Supplied Items</span>
                </button>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    className="btn btn-secondary btn-icon-only"
                    onClick={() => handleOpenEdit(sup)}
                    title="Edit Supplier"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    className="btn btn-danger btn-icon-only"
                    onClick={() => setDeletingSupplier(sup)}
                    title="Delete Supplier"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier Details' : 'Register New Supplier'}
        maxWidth="500px"
      >
        {error && (
          <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>Supplier / Company Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Penguin Random House Dist."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Person</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sarah Jenkins"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 (202) 555-0143"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="orders@publisher.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Supplied Categories</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Books (Fiction, Non-Fiction) or Fine Pens"
              value={formData.supplied_categories}
              onChange={(e) => setFormData({ ...formData, supplied_categories: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Address / Warehouse Location</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="1745 Broadway, New York, NY 10019"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Linked Products Modal */}
      <Modal
        isOpen={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        title={`Products Supplied by "${viewingSupplier?.name}"`}
        maxWidth="600px"
      >
        {loadingLinked ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading supplied items...</div>
        ) : linkedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No products currently assigned to this supplier.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {linkedProducts.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong></td>
                    <td>
                      <span className={`badge ${p.category === 'Book' ? 'badge-book' : 'badge-stationery'}`}>
                        {p.category}
                      </span>
                    </td>
                    <td>₹{Number(p.price).toFixed(2)}</td>
                    <td>{p.stock_quantity} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewingSupplier(null)}>
            Close
          </button>
        </div>
      </Modal>

      {/* Delete Supplier Modal */}
      <Modal
        isOpen={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        title="Confirm Supplier Removal"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Are you sure you want to remove <strong>"{deletingSupplier?.name}"</strong>? Any linked catalog products will have their supplier unassigned.
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeletingSupplier(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Remove Supplier
          </button>
        </div>
      </Modal>
    </div>
  );
}
