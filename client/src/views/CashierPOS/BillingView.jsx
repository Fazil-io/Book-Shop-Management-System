import React, { useEffect, useState, useRef } from 'react';
import Modal from '../../components/Modal';
import InvoiceModal from '../../components/InvoiceModal';
import BarcodeTag from '../../components/BarcodeTag';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import CameraScanner from '../../components/CameraScanner';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  UserCheck, 
  UserPlus, 
  CheckCircle2, 
  Book, 
  PenTool, 
  Printer, 
  Sparkles,
  Barcode,
  Camera
} from 'lucide-react';

export default function BillingView() {
  const { user } = useAuth();

  // Catalog items
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Active Cart State
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Card' | 'UPI'

  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // UPI QR simulation modal
  const [showUpiModal, setShowUpiModal] = useState(false);

  // Invoice / Completed Bill Modal
  const [completedBill, setCompletedBill] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Submitting state & errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera barcode scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const barcodeInputRef = useRef(null);

  // Fetch catalog products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error loading products for POS:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Quick Barcode scanner enter listener
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const query = search.trim().toLowerCase();
    // Try exact match on barcode/ISBN
    const match = products.find(p => p.barcode_isbn.toLowerCase() === query) 
      || products.find(p => p.title.toLowerCase().includes(query));

    if (match) {
      addToCart(match);
      setSearch('');
    }
  };

  // Add item to cart
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: +(item.unit_price * (item.quantity + 1)).toFixed(2) }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            title: product.title,
            barcode_isbn: product.barcode_isbn,
            unit_price: product.price,
            quantity: 1,
            subtotal: Number(product.price),
            max_stock: Math.max(product.stock_quantity || 0, 999)
          }
        ];
      }
    });
  };

  // Modify cart quantity
  const updateQuantity = (productId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              subtotal: +(item.unit_price * newQty).toFixed(2)
            };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setActiveCustomer(null);
    setCustomerPhone('');
  };

  // Customer Phone Lookup
  const handleCustomerPhoneChange = async (e) => {
    const val = e.target.value;
    setCustomerPhone(val);

    if (val.trim().length >= 6) {
      try {
        const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.customer) {
            setActiveCustomer(data.customer);
          } else {
            setActiveCustomer(null);
          }
        }
      } catch (err) {
        console.error('Customer lookup error:', err);
      }
    } else {
      setActiveCustomer(null);
    }
  };

  // Quick Register Customer from POS
  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName,
          phone_number: customerPhone,
          email: newCustomerEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to register customer');
        return;
      }

      setActiveCustomer(data.customer);
      setIsCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerEmail('');
    } catch (err) {
      alert('Error registering customer');
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const taxAmount = +(subtotal * 0.05).toFixed(2); // 5% GST
  const finalDiscount = Math.min(discountAmount, subtotal + taxAmount);
  const grandTotal = Math.max(0, +(subtotal + taxAmount - finalDiscount).toFixed(2));

  // Checkout and Generate Bill
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items to checkout.');
      return;
    }

    if (paymentMode === 'UPI' && !showUpiModal) {
      setShowUpiModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        customer_id: activeCustomer ? activeCustomer.id : null,
        cashier_id: user ? user.id : 'usr_cashier',
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        discount_amount: finalDiscount,
        payment_mode: paymentMode
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate bill');
      }

      // Success! Open invoice modal
      setCompletedBill({
        sale: data.sale,
        items: data.items
      });
      setIsInvoiceOpen(true);
      setShowUpiModal(false);

      // Refresh product stock in catalog
      fetchProducts();

      // Reset cart for next customer
      clearCart();
    } catch (err) {
      setErrorMessage(err.message);
      alert('Checkout error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products for catalog
  const filteredProducts = products.filter(p => {
    const matchesCategory = category === 'All' || p.category === category;
    const matchesSearch = !search.trim() || 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode_isbn.includes(search) ||
      (p.author_brand && p.author_brand.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Point of Sale (POS) Counter</h2>
          <p>Scan barcode, add items, link customer phone, and process instant receipts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', padding: '0.4rem 0.8rem' }}>
            Register 01 • Active Cashier: <strong>{user?.name?.split(' ')[0] || 'Cashier'}</strong>
          </span>
        </div>
      </div>

      {/* POS Layout: Left Catalog / Right Cart */}
      <div className="pos-layout">
        {/* Left: Product Catalog & Quick Scanner */}
        <div>
          {/* Quick Scanner & Category Filter */}
          <div className="filter-bar" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
            <form onSubmit={handleBarcodeSubmit} className="search-box" style={{ maxWidth: '100%', flex: 1 }}>
              <Barcode size={18} />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan Barcode / ISBN or type title (Press Enter to add)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {/* Camera Scanner Button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsScannerOpen(true)}
              title="Open Camera Barcode Scanner"
              style={{ flexShrink: 0, gap: '0.4rem' }}
            >
              <Camera size={16} />
              <span>Camera</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['All', 'Book', 'Stationery'].map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'Book' && <Book size={13} />}
                {cat === 'Stationery' && <PenTool size={13} />}
                <span>{cat === 'All' ? 'All Items' : cat}</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading products...
            </div>
          ) : (
            <div className="pos-catalog-grid">
              {filteredProducts.map(prod => {
                return (
                  <div
                    key={prod.id}
                    className="pos-item-card"
                    onClick={() => addToCart(prod)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    title={`Click to add "${prod.title}" to bill`}
                  >
                    <div>
                      <div className="pos-item-header">
                        <span className={`badge ${prod.category === 'Book' ? 'badge-book' : 'badge-stationery'}`} style={{ fontSize: '0.65rem' }}>
                          {prod.category}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {prod.barcode_isbn.slice(-6)}
                        </span>
                      </div>
                      <div className="pos-item-title" style={{ marginTop: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                        {prod.title}
                      </div>
                      {prod.author_brand && (
                        <div className="pos-item-author" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prod.author_brand}</div>
                      )}

                      {/* Barcode Image directly on the product card */}
                      <div 
                        style={{ margin: '0.6rem 0 0.4rem', display: 'flex', justifyContent: 'center' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod);
                        }}
                      >
                        <BarcodeRenderer 
                          value={prod.barcode_isbn} 
                          width={140} 
                          height={28} 
                          showText={true} 
                          interactive={true} 
                        />
                      </div>
                    </div>

                    <div className="pos-item-bottom" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                      <div className="pos-item-price" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        ₹{Number(prod.price).toFixed(2)}
                      </div>
                      <div className="pos-item-stock" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {prod.stock_quantity > 0 ? `${prod.stock_quantity} in stock` : 'Stock: 0'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Bill & POS Cart */}
        <div className="pos-cart-panel">
          <div className="pos-cart-header">
            <h3>Current Bill</h3>
            {cart.length > 0 && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={clearCart}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer Lookup Section */}
          <div className="pos-customer-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <input
                type="tel"
                className="form-input"
                placeholder="Customer Phone (e.g. 9876543210)"
                value={customerPhone}
                onChange={handleCustomerPhoneChange}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              />
              {!activeCustomer && customerPhone.length >= 6 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCustomerModalOpen(true)}
                  title="Register new customer"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <UserPlus size={14} />
                  <span>+ Add</span>
                </button>
              )}
            </div>

            {activeCustomer ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', background: 'var(--accent-gold-subtle)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  <UserCheck size={14} />
                  <span>{activeCustomer.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {activeCustomer.reward_points} pts
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Enter phone to link customer loyalty points
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="pos-cart-items-list">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <ShoppingBag size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p>No items added to current bill</p>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Click catalog items or scan barcode</span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="cart-item-row">
                  <div className="cart-item-info">
                    <div className="cart-item-title">{item.title}</div>
                    <div className="cart-item-price-unit">₹{Number(item.unit_price).toFixed(2)} each</div>
                  </div>

                  <div className="cart-qty-ctrl">
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.product_id, -1)}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="cart-qty-num">{item.quantity}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.product_id, 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="cart-item-line-total">
                    ₹{Number(item.subtotal).toFixed(2)}
                  </div>

                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.product_id)}
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary Calculations & Checkout */}
          <div className="pos-cart-summary">
            <div className="summary-line">
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Tax (5% GST):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount / Loyalty Redemption */}
            <div className="summary-line">
              <span>Discount:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>-₹</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{ width: '60px', padding: '0.15rem 0.35rem', fontSize: '0.8rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            <div className="summary-line total">
              <span>Grand Total:</span>
              <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment Mode Selector */}
            <div className="payment-mode-selector">
              <button
                type="button"
                className={`payment-mode-btn ${paymentMode === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMode('Cash')}
              >
                <DollarSign size={16} />
                <span>Cash</span>
              </button>

              <button
                type="button"
                className={`payment-mode-btn ${paymentMode === 'Card' ? 'active' : ''}`}
                onClick={() => setPaymentMode('Card')}
              >
                <CreditCard size={16} />
                <span>Card</span>
              </button>

              <button
                type="button"
                className={`payment-mode-btn ${paymentMode === 'UPI' ? 'active' : ''}`}
                onClick={() => setPaymentMode('UPI')}
              >
                <QrCode size={16} />
                <span>UPI QR</span>
              </button>
            </div>

            {/* Checkout Action */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleCheckout}
            >
              <Printer size={18} />
              <span>{isSubmitting ? 'Processing Bill...' : `Complete Sale & Print (₹${grandTotal.toFixed(2)})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulated UPI QR Code Modal */}
      <Modal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        title="UPI Instant Payment"
        maxWidth="400px"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Scan with Google Pay, PhonePe, Paytm or any BHIM UPI app:
          </div>

          {/* Realistic Styled Dynamic QR Code Box */}
          <div style={{ 
            width: '180px', 
            height: '180px', 
            margin: '0 auto 1.25rem', 
            background: '#FFFFFF', 
            padding: '12px', 
            borderRadius: 'var(--radius-md)', 
            border: '2px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <QrCode size={140} color="#111" />
            <span style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px', fontWeight: 'bold' }}>
              vijaybookstore@upi
            </span>
          </div>

          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
            ₹{grandTotal.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Bill: VBS-{new Date().getFullYear()}-AUTO
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowUpiModal(false)}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            <CheckCircle2 size={16} />
            <span>Confirm UPI Received</span>
          </button>
        </div>
      </Modal>

      {/* Register Customer Quick Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Quick Customer Registration"
        maxWidth="420px"
      >
        <form onSubmit={handleRegisterCustomer}>
          <div className="form-group">
            <label>Customer Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Maya Lin"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              className="form-input"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address (Optional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="maya@example.com"
              value={newCustomerEmail}
              onChange={(e) => setNewCustomerEmail(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register & Link to Cart
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        saleData={completedBill}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onDetected={(code) => {
          // Try to find product by exact barcode, then partial
          const match = products.find(p => p.barcode_isbn === code)
            || products.find(p => p.barcode_isbn.includes(code))
            || products.find(p => p.title.toLowerCase().includes(code.toLowerCase()));
          if (match) {
            addToCart(match);
            setSearch('');
          } else {
            // Fill the search box so user can see what was scanned
            setSearch(code);
          }
        }}
      />
    </div>
  );
}

