import React, { useState } from 'react';
import Modal from './Modal';
import { generateInvoicePdf } from '../utils/generateInvoicePdf';
import { 
  Printer, 
  CheckCircle2, 
  MessageCircle, 
  Send, 
  Phone, 
  FileText, 
  Download, 
  Share2, 
  ExternalLink 
} from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, saleData }) {
  if (!saleData) return null;

  const { sale, items = [] } = saleData;
  const [customPhone, setCustomPhone] = useState(sale.customer_phone || '');
  const [showPhoneBox, setShowPhoneBox] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      const { save, fileName } = generateInvoicePdf(sale, items);
      save();
      setPdfNotice(`✅ Downloaded "${fileName}" to your device.`);
      setTimeout(() => setPdfNotice(''), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate PDF: ' + err.message);
    }
  };

  const handleSendWhatsAppPdf = async () => {
    let raw = (customPhone || sale.customer_phone || '').replace(/\D/g, '');
    if (!raw) {
      setShowPhoneBox(true);
      return;
    }
    // Prepend 91 if 10-digit Indian phone
    if (raw.length === 10) {
      raw = '91' + raw;
    }

    try {
      const { file, save, fileName } = generateInvoicePdf(sale, items);

      // 1. Try Native Web Share API (Works on Mobile Chrome/Safari, Android, iOS with direct WhatsApp file attach)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Vijay Book Store Invoice - ${sale.bill_number}`,
            text: `🧾 Tax Invoice #${sale.bill_number} from Vijay Book Store (Grand Total: ₹${Number(sale.total_amount).toFixed(2)})`
          });
          setPdfNotice(`✅ Shared PDF invoice to WhatsApp!`);
          setTimeout(() => setPdfNotice(''), 4000);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return; // User cancelled share dialog
          console.warn('Native share failed, falling back to download + web chat:', shareErr);
        }
      }

      // 2. Desktop Fallback: Download PDF document and open WhatsApp chat
      save(); // Download the official PDF invoice

      const itemsSummary = items.map((it, idx) => 
        `${idx + 1}. *${it.product_title}* (Qty: ${it.quantity}) — ₹${Number(it.subtotal).toFixed(2)}`
      ).join('\n');

      const msg = 
`🧾 *VIJAY BOOK STORE - TAX INVOICE (PDF)*
━━━━━━━━━━━━━━━━━━━━━━
*Invoice No:* ${sale.bill_number}
*Date:* ${new Date(sale.created_at || Date.now()).toLocaleString()}
*Cashier:* ${sale.cashier_name || 'Counter Staff'}
${sale.customer_name ? `*Customer:* ${sale.customer_name}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
*ITEMS SUMMARY:*
${itemsSummary}
━━━━━━━━━━━━━━━━━━━━━━
*Subtotal:* ₹${Number(sale.subtotal).toFixed(2)}
*Tax (5% GST):* ₹${Number(sale.tax_amount || 0).toFixed(2)}
${sale.discount_amount > 0 ? `*Discount:* -₹${Number(sale.discount_amount).toFixed(2)}\n` : ''}*GRAND TOTAL:* ₹${Number(sale.total_amount).toFixed(2)}
*Payment Mode:* ${sale.payment_mode}
━━━━━━━━━━━━━━━━━━━━━━
📄 *Official PDF Invoice attached: "${fileName}"*
🙏 *Thank you for choosing Vijay Book Store!*
📍 No. 12, Gandhi Road, Coimbatore – 641 001
📞 Contact: +91 98765 43210`;

      const waUrl = `https://wa.me/${raw}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      setPdfNotice(`📄 PDF "${fileName}" downloaded! WhatsApp chat opened — simply attach the downloaded PDF invoice.`);
    } catch (err) {
      console.error('Error in WhatsApp PDF workflow:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice & Receipt" maxWidth="520px">
      <div className="receipt-paper" id="printable-receipt">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-store-title">VIJAY BOOK STORE</div>
          <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '2px' }}>Books, Stationery & Educational Supplies</div>
          <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px' }}>
            No. 12, Gandhi Road, Coimbatore – 641 001<br />
            Tel: +91 98765 43210 | GSTIN: 33AABCB2026B1Z7
          </div>
        </div>

        {/* Bill Metadata */}
        <div style={{ fontSize: '0.78rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
          <div><strong>Bill No:</strong> {sale.bill_number}</div>
          <div><strong>Date:</strong> {new Date(sale.created_at || Date.now()).toLocaleString()}</div>
          <div><strong>Cashier:</strong> {sale.cashier_name || 'Counter Staff'}</div>
          {sale.customer_name && (
            <div>
              <strong>Customer:</strong> {sale.customer_name} ({sale.customer_phone || ''})
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #444', marginBottom: '0.5rem' }} />

        {/* Items Table */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>
            <span style={{ flex: 2 }}>ITEM</span>
            <span style={{ flex: 1, textAlign: 'center' }}>QTY</span>
            <span style={{ flex: 1, textAlign: 'right' }}>PRICE</span>
            <span style={{ flex: 1, textAlign: 'right' }}>TOTAL</span>
          </div>

          {items.map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px dotted #eee' }}>
              <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.product_title}
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>{it.quantity}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>₹{Number(it.unit_price).toFixed(2)}</span>
              <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>₹{Number(it.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="receipt-totals" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{Number(sale.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax (5% GST):</span>
            <span>₹{Number(sale.tax_amount || 0).toFixed(2)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B91C1C' }}>
              <span>Loyalty Discount:</span>
              <span>-₹{Number(sale.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', borderTop: '1px solid #444', paddingTop: '4px', marginTop: '4px' }}>
            <span>GRAND TOTAL:</span>
            <span>₹{Number(sale.total_amount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem' }}>
            <span>Payment Mode:</span>
            <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{sale.payment_mode}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <div>Thank you for shopping at Vijay Book Store!</div>
          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
            Exchange within 14 days with original receipt.<br />
            Earn loyalty points on every purchase.
          </div>
          <div style={{ marginTop: '8px', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            * {sale.bill_number} *
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {pdfNotice && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.65rem 0.85rem',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: '#1E40AF',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          animation: 'pulse 0.5s ease-in-out'
        }}>
          <FileText size={16} />
          <span>{pdfNotice}</span>
        </div>
      )}

      {/* WhatsApp recipient phone prompt */}
      {showPhoneBox && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Phone size={14} />
            <span>Enter Customer WhatsApp Number:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              placeholder="e.g. 9876543210"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
            />
            <button
              className="btn btn-sm"
              style={{ background: '#22C55E', color: '#FFF', border: 'none', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={handleSendWhatsAppPdf}
            >
              <Send size={14} />
              <span>Send PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Download PDF Button */}
          <button
            className="btn btn-secondary"
            onClick={handleDownloadPdf}
            title="Download PDF Tax Invoice to computer/phone"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={15} />
            <span>PDF Invoice</span>
          </button>

          {/* Send PDF on WhatsApp Button */}
          <button
            className="btn"
            style={{
              background: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(37,211,102,0.25)'
            }}
            onClick={() => {
              if (sale.customer_phone || customPhone) {
                handleSendWhatsAppPdf();
              } else {
                setShowPhoneBox(prev => !prev);
              }
            }}
            title="Send PDF bill invoice to customer via WhatsApp"
          >
            <MessageCircle size={16} />
            <span>Send PDF on WhatsApp</span>
          </button>

          {/* Print Button */}
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
