import React, { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import ChartView from '../../components/ChartView';
import InvoiceModal from '../../components/InvoiceModal';
import Modal from '../../components/Modal';
import BarcodeTag from '../../components/BarcodeTag';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  BookOpen, 
  Layers, 
  CreditCard,
  Eye,
  ArrowUpRight,
  Sparkles,
  RotateCcw,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function OverviewTab({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStock, setResetStock] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleResetData = async () => {
    setIsResetting(true);
    setResetMsg('');
    try {
      const res = await fetch('/api/analytics/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetStock })
      });
      const resJson = await res.json();
      if (res.ok) {
        setResetMsg(resJson.message || 'Store data successfully reset to 0.');
        await fetchOverview();
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetMsg('');
        }, 1200);
      } else {
        alert(resJson.error || 'Failed to reset data');
      }
    } catch (err) {
      alert('Error resetting data');
    } finally {
      setIsResetting(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/analytics/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleViewReceipt = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (res.ok) {
        const saleDetails = await res.json();
        setSelectedSale(saleDetails);
        setIsInvoiceOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <p>Loading analytics and inventory metrics...</p>
      </div>
    );
  }

  const { metrics, lowStockAlerts = [], charts, paymentBreakdown = [], categoryBreakdown = [], topSellers = [], recentTransactions = [] } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Store Overview & Analytics</h2>
          <p>Real-time metrics, revenue performance, and inventory health</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsResetModalOpen(true)}
            style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger-border)' }}
            title="Reset store sales and metrics to 0"
          >
            <RotateCcw size={16} />
            <span>Reset Data to 0</span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigateTab('pos')}>
            <ShoppingBag size={16} />
            <span>Launch POS Terminal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <StatCard
          label="Today's Sales"
          value={`₹${Number(metrics?.todaySales || 0).toFixed(2)}`}
          subtext={`${metrics?.todayOrders || 0} order(s) processed today`}
          icon={DollarSign}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${Number(metrics?.totalRevenue || 0).toFixed(2)}`}
          subtext={`Across ${metrics?.totalOrders || 0} total transactions`}
          icon={TrendingUp}
        />
        <StatCard
          label="Low Stock Alerts"
          value={metrics?.lowStockCount || 0}
          subtext={`${lowStockAlerts.filter(i => i.stock_quantity <= 0).length} completely out of stock`}
          icon={AlertTriangle}
          alert={(metrics?.lowStockCount || 0) > 0}
          onClick={() => setIsLowStockModalOpen(true)}
        />
        <StatCard
          label="Total Customers"
          value={metrics?.totalCustomers || 0}
          subtext="Active loyalty members"
          icon={Users}
          onClick={() => onNavigateTab('customers')}
        />
      </div>

      {/* Secondary Catalog Summary */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'var(--bg-surface-elevated)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catalog Items</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {metrics?.catalog?.total_products || 0} Total ({metrics?.catalog?.total_books || 0} Books, {metrics?.catalog?.total_stationery || 0} Stationery)
              </div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'var(--border-medium)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inventory Valuation</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                ₹{Number(metrics?.catalog?.inventory_retail_value || 0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Cost: ₹{Number(metrics?.catalog?.inventory_cost_value || 0).toFixed(2)})</span>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('inventory')}>
            <Layers size={14} />
            <span>Manage Inventory</span>
          </button>
        </div>
      </div>

      {/* Interactive Sales Chart */}
      <ChartView charts={charts} />

      {/* Two Column Section: Category & Payment Breakdown + Top Sellers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', margin: '1.75rem 0' }}>
        {/* Category & Payment Breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: '1rem' }}>
            Revenue Distribution
          </h3>

          {/* Category split */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Category Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categoryBreakdown.map((cat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${cat.category === 'Book' ? 'badge-book' : 'badge-stationery'}`}>
                      {cat.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cat.units_sold} units sold</span>
                  </div>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ₹{Number(cat.revenue).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment mode split */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Payment Modes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {paymentBreakdown.map((p, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0.65rem 0.35rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.payment_mode}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', margin: '2px 0' }}>₹{Number(p.total).toFixed(0)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.count} bills</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Best Sellers */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-gold)" />
            <span>Top Performing Items</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {topSellers.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: 'var(--radius-full)', 
                    background: i === 0 ? 'var(--accent-gold)' : 'var(--bg-surface-elevated)', 
                    color: i === 0 ? '#FFF' : 'var(--text-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product_title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.category} • ₹{Number(item.price).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                    ₹{Number(item.total_revenue).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.total_qty} sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem' }}>
            Recent Transactions
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('reports')}>
            <span>View All Bills</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Payment Mode</th>
                <th>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{sale.bill_number}</strong>
                  </td>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
                  <td>{sale.customer_name || 'Walk-in Guest'}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)' }}>
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
                      onClick={() => handleViewReceipt(sale.id)}
                    >
                      <Eye size={14} />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts Modal */}
      <Modal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        title="⚠️ Low Stock Alert Center"
        maxWidth="600px"
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          The following products have fallen to or below their low-stock thresholds. Immediate reorder is recommended:
        </p>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>ISBN/Barcode</th>
              </tr>
            </thead>
            <tbody>
              {lowStockAlerts.map(prod => (
                <tr key={prod.id}>
                  <td>
                    <strong>{prod.title}</strong>
                  </td>
                  <td>
                    <span className={`badge ${prod.category === 'Book' ? 'badge-book' : 'badge-stationery'}`}>
                      {prod.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${prod.stock_quantity <= 0 ? 'badge-status-out-of-stock' : 'badge-status-low-stock'}`}>
                      {prod.stock_quantity} units
                    </span>
                  </td>
                  <td>{prod.low_stock_threshold}</td>
                  <td>
                    <BarcodeTag code={prod.barcode_isbn} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setIsLowStockModalOpen(false)}>
            Close
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setIsLowStockModalOpen(false);
              onNavigateTab('inventory');
            }}
          >
            Manage Stock Levels
          </button>
        </div>
      </Modal>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        saleData={selectedSale}
      />

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => !isResetting && setIsResetModalOpen(false)}
        title="⚠️ Reset Store Data to 0"
        maxWidth="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {resetMsg ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--status-success-bg)',
              border: '1px solid var(--status-success-border)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-success)'
            }}>
              <CheckCircle2 size={24} />
              <div>
                <strong>Success!</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{resetMsg}</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to reset all store transaction metrics to <strong>0</strong>?
              </p>

              <div style={{
                background: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--status-danger)', marginBottom: '0.35rem' }}>
                  The following data will be reset to 0:
                </div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <li>Today's Sales & Orders (wiped to ₹0.00)</li>
                  <li>Total Revenue & All Historical Bills (wiped to ₹0.00)</li>
                  <li>Customer total purchases & reward points (reset to 0)</li>
                  <li>Sales trend charts & category breakdowns (reset to 0)</li>
                </ul>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={resetStock}
                  onChange={(e) => setResetStock(e.target.checked)}
                />
                <span>Also reset all product stock quantities to 0</span>
              </label>

              <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                  onClick={handleResetData}
                  disabled={isResetting}
                >
                  <Trash2 size={15} />
                  <span>{isResetting ? 'Resetting...' : 'Confirm Reset to 0'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
