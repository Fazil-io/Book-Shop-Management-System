import { jsPDF } from 'jspdf';

/**
 * Generates a professional Tax Invoice PDF for Vijay Book Store
 * @param {Object} sale - Sale metadata
 * @param {Array} items - List of line items
 * @returns {Object} { doc, blob, file, save, fileName }
 */
export function generateInvoicePdf(sale, items = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const fileName = `Invoice-${sale.bill_number || 'VBS'}.pdf`;

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 10, 'F');

  // Store Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('VIJAY BOOK STORE', 105, 24, { align: 'center' });

  // Subtitle & Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Books, Stationery & Educational Supplies', 105, 30, { align: 'center' });
  doc.text('No. 12, Gandhi Road, Coimbatore – 641 001 | Phone: +91 98765 43210', 105, 35, { align: 'center' });
  doc.text('GSTIN: 33AABCB2026B1Z7 | Email: contact@vijaybookstore.com', 105, 40, { align: 'center' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(15, 45, 195, 45);

  // 2. Invoice Meta Cards
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 49, 180, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 49, 180, 24, 2, 2, 'S');

  // Customer column
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO:', 20, 56);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(sale.customer_name ? `${sale.customer_name}` : 'Walk-in Customer', 20, 62);
  doc.text(sale.customer_phone ? `Phone: ${sale.customer_phone}` : 'Payment: ' + (sale.payment_mode || 'Cash'), 20, 68);

  // Bill Details column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE DETAILS:', 120, 56);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Invoice No: ${sale.bill_number}`, 120, 62);
  const formattedDate = new Date(sale.created_at || Date.now()).toLocaleString();
  doc.text(`Date: ${formattedDate}`, 120, 68);

  // 3. Items Table Header
  let y = 80;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('#', 18, y + 5.5);
  doc.text('ITEM DESCRIPTION', 26, y + 5.5);
  doc.text('BARCODE / ISBN', 105, y + 5.5);
  doc.text('QTY', 145, y + 5.5, { align: 'center' });
  doc.text('PRICE (Rs.)', 168, y + 5.5, { align: 'right' });
  doc.text('TOTAL (Rs.)', 190, y + 5.5, { align: 'right' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  items.forEach((it, idx) => {
    y += 7;
    // Row zebra background
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, y - 5, 180, 7, 'F');
    }

    doc.text(String(idx + 1), 18, y);
    // Truncate long title if needed
    const safeTitle = it.product_title && it.product_title.length > 36 
      ? it.product_title.slice(0, 34) + '...' 
      : (it.product_title || 'Item');
    doc.text(safeTitle, 26, y);
    doc.text(it.barcode_isbn ? String(it.barcode_isbn).slice(-10) : '—', 105, y);
    doc.text(String(it.quantity), 145, y, { align: 'center' });
    doc.text(Number(it.unit_price).toFixed(2), 168, y, { align: 'right' });
    doc.text(Number(it.subtotal).toFixed(2), 190, y, { align: 'right' });

    y += 1;
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y, 195, y);
  });

  y += 8;

  // 4. Financial Totals
  doc.setDrawColor(203, 213, 225);
  doc.line(120, y, 195, y);

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', 155, y, { align: 'right' });
  doc.text(`Rs. ${Number(sale.subtotal).toFixed(2)}`, 190, y, { align: 'right' });

  y += 5.5;
  doc.text('Tax (5% GST):', 155, y, { align: 'right' });
  doc.text(`Rs. ${Number(sale.tax_amount || 0).toFixed(2)}`, 190, y, { align: 'right' });

  if (sale.discount_amount > 0) {
    y += 5.5;
    doc.setTextColor(185, 28, 28);
    doc.text('Loyalty Discount:', 155, y, { align: 'right' });
    doc.text(`-Rs. ${Number(sale.discount_amount).toFixed(2)}`, 190, y, { align: 'right' });
  }

  // Grand Total Box
  y += 7;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, y - 5, 75, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('GRAND TOTAL:', 155, y + 2, { align: 'right' });
  doc.text(`Rs. ${Number(sale.total_amount).toFixed(2)}`, 190, y + 2, { align: 'right' });

  // Payment badge on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`PAID VIA ${String(sale.payment_mode || 'Cash').toUpperCase()}`, 20, y + 1);

  // 5. Footer & Barcode note
  y = 265;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Thank you for choosing Vijay Book Store!', 105, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Goods once sold can be exchanged within 14 days with original tax invoice.', 105, y, { align: 'center' });
  doc.text('Earn & redeem reward points on every purchase across all books & stationery.', 105, y + 4, { align: 'center' });
  doc.text(`* ${sale.bill_number} *`, 105, y + 9, { align: 'center' });

  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });

  return {
    doc,
    blob,
    file,
    fileName,
    save: () => doc.save(fileName)
  };
}
