import React, { useEffect, useState } from 'react';
import InvoiceModal from '../../components/InvoiceModal';
import { FileText, Filter, Eye, DollarSign, Calendar, CreditCard, RefreshCw } from 'lucide-react';

export default function ReportsTab() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Invoice Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentMode !== 'All') params.append('payment_mode', paymentMode);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '100');

      const res = await fetch(`/api/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
      }
    } catch (err) {
      console.error('Error fetching sales reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [paymentMode]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const handleOpenReceipt = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReceipt(data);
        setIsInvoiceOpen(true);
      }
    } catch (err) {
      console.error('Error opening receipt:', err);
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalTax = sales.reduce((sum, s) => sum + (s.tax_amount || 0), 0);
  const totalDiscount = sales.reduce((sum, s) => sum + (s.discount_amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Sales & Revenue Reports</h2>
          <p>Filter historical sales transactions, inspect tax breakdowns, and view original invoices</p>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface-elevated)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filtered Transactions</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{sales.length} Bills</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Gross Revenue</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>₹{totalRevenue.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected Tax (GST)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>₹{totalTax.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discounts Given</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--status-danger)' }}>₹{totalDiscount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="filter-bar">
        <div className="filter-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Mode:</label>
          <select
            className="select-input"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date Range:</label>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px', padding: '0.4rem 0.6rem' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '150px', padding: '0.4rem 0.6rem' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={14} />
            <span>Filter</span>
          </button>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setPaymentMode('All');
              setStartDate('');
              setEndDate('');
              fetchSales();
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </form>

      {/* Reports Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bill Number</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading sales reports...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No sales found for the selected filter parameters.
                </td>
              </tr>
            ) : (
              sales.map(sale => (
                <tr key={sale.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{sale.bill_number}</strong>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(sale.created_at).toLocaleString()}</td>
                  <td>{sale.customer_name || 'Walk-in Guest'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sale.cashier_name || 'Staff'}</td>
                  <td>{sale.item_count} items</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(sale.subtotal).toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ₹{Number(sale.tax_amount).toFixed(2)}
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                      ₹{Number(sale.total_amount).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)' }}>
                      {sale.payment_mode}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenReceipt(sale.id)}
                    >
                      <Eye size={13} />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        saleData={selectedReceipt}
      />
    </div>
  );
}
