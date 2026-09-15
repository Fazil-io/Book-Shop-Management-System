import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import InvoiceModal from '../../components/InvoiceModal';
import { Plus, Search, Users, Award, Phone, Mail, History, Eye, Edit3, ShoppingBag } from 'lucide-react';

export default function CustomerTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    reward_points: 10
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Purchase History Modal
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historySales, setHistorySales] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Invoice Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = search.trim() ? `/api/customers?search=${encodeURIComponent(search.trim())}` : '/api/customers';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone_number: '',
      email: '',
      reward_points: 10
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone_number: c.phone_number,
      email: c.email || '',
      reward_points: c.reward_points || 0
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save customer');
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (customer) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistorySales(data.sales || []);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenBillDetails = (sale) => {
    setSelectedReceipt({
      sale,
      items: sale.items || []
    });
    setIsInvoiceOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Customer Directory & Loyalty Program</h2>
          <p>Search customers by phone number, inspect purchase histories, and manage reward points</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by phone number, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <button className="btn btn-secondary" onClick={fetchCustomers}>
          <span>Search</span>
        </button>
      </div>

      {/* Customer Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Reward Points</th>
              <th>Total Lifetime Purchases</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading customer database...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No customer records found matching "{search}".
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Joined {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                      <Phone size={13} color="var(--text-muted)" />
                      <span>{c.phone_number}</span>
                    </div>
                  </td>
                  <td>
                    {c.email ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Mail size={13} color="var(--text-muted)" />
                        <span>{c.email}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)', border: '1px solid rgba(184, 134, 11, 0.3)', gap: '0.35rem' }}>
                      <Award size={13} />
                      <span>{c.reward_points} pts</span>
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                      ₹{Number(c.total_purchases).toFixed(2)}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewHistory(c)}
                        title="View Purchase History"
                      >
                        <History size={14} />
                        <span>History</span>
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Customer"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Info' : 'New Customer Registration'}
        maxWidth="480px"
      >
        {formError && (
          <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>Customer Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Clara Oswald"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number (Lookup Key) *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="clara@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Reward Points Balance</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={formData.reward_points}
              onChange={(e) => setFormData({ ...formData, reward_points: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Purchase History Modal */}
      <Modal
        isOpen={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        title={`Purchase History: ₹{historyCustomer?.name}`}
        maxWidth="680px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {historyCustomer?.phone_number}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reward Points: {historyCustomer?.reward_points} pts</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lifetime Value</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
              ₹{Number(historyCustomer?.total_purchases).toFixed(2)}
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading purchase history...</div>
        ) : historySales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No sales recorded for this customer yet.
          </div>
        ) : (
          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Items Purchased</th>
                  <th>Mode</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {historySales.map(sale => (
                  <tr key={sale.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{sale.bill_number}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(sale.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {sale.items?.map(it => `${it.product_title} (${it.quantity}x)`).join(', ') || 'Items'}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-surface-elevated)' }}>
                        {sale.payment_mode}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                        ₹{Number(sale.total_amount).toFixed(2)}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenBillDetails(sale)}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setHistoryCustomer(null)}>
            Close
          </button>
        </div>
      </Modal>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        saleData={selectedReceipt}
      />
    </div>
  );
}
