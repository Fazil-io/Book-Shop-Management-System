const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { all, get, run, db } = require('../db/database');

// GET /api/sales
router.get('/', (req, res) => {
  try {
    const { payment_mode, startDate, endDate, limit = 50 } = req.query;

    let sql = `
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone_number as customer_phone,
        u.name as cashier_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.cashier_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (payment_mode && payment_mode !== 'All') {
      sql += ' AND s.payment_mode = ?';
      params.push(payment_mode);
    }

    if (startDate) {
      sql += ' AND s.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND s.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY s.created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 50);

    const sales = all(sql, params);
    res.json({ sales });
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// GET /api/sales/:id
router.get('/:id', (req, res) => {
  try {
    const sale = get(
      `SELECT 
        s.*,
        c.name as customer_name,
        c.phone_number as customer_phone,
        c.email as customer_email,
        c.reward_points as customer_reward_points,
        u.name as cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.cashier_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!sale) {
      return res.status(404).json({ error: 'Sale record not found' });
    }

    const items = all('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    res.json({ sale, items });
  } catch (err) {
    console.error('Error fetching sale details:', err);
    res.status(500).json({ error: 'Failed to fetch sale details' });
  }
});

// POST /api/sales (Create Bill / POS Checkout)
router.post('/', (req, res) => {
  try {
    const {
      customer_id,
      cashier_id,
      items,
      discount_amount = 0,
      payment_mode = 'Cash'
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required to generate a bill' });
    }

    const validModes = ['Cash', 'Card', 'UPI'];
    if (!validModes.includes(payment_mode)) {
      return res.status(400).json({ error: 'Invalid payment mode. Must be Cash, Card, or UPI' });
    }

    // 1. Verify product exists for each item
    for (const item of items) {
      const prod = get('SELECT id, title, stock_quantity, price FROM products WHERE id = ?', [item.product_id]);
      if (!prod) {
        return res.status(404).json({ error: `Product not found for ID: ${item.product_id}` });
      }
    }

    // 2. Begin atomic transaction using SQLite
    db.exec('BEGIN TRANSACTION');

    try {
      let subtotal = 0;
      const saleId = 'sale_' + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();

      // Calculate bill number
      const countRes = get('SELECT COUNT(*) as count FROM sales');
      const billNumber = `BBS-${new Date().getFullYear()}-${1000 + (countRes?.count || 0) + 1}`;

      const preparedItems = [];
      for (const item of items) {
        const prod = get('SELECT id, title, barcode_isbn, price FROM products WHERE id = ?', [item.product_id]);
        if (!prod) continue;
        const unitPrice = item.unit_price != null ? parseFloat(item.unit_price) : prod.price;
        const lineTotal = +(unitPrice * item.quantity).toFixed(2);
        subtotal += lineTotal;
        const itemId = 'item_' + crypto.randomUUID().slice(0, 8);
        preparedItems.push({
          itemId,
          prodId: prod.id,
          title: prod.title,
          barcode_isbn: prod.barcode_isbn,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        });
      }

      subtotal = +subtotal.toFixed(2);
      const taxRate = 0.05; // 5% Standard tax
      const taxAmount = +(subtotal * taxRate).toFixed(2);
      const discount = Math.max(0, parseFloat(discount_amount) || 0);
      const totalAmount = Math.max(0, +(subtotal + taxAmount - discount).toFixed(2));

      const finalCashierId = cashier_id || (req.user ? req.user.id : 'usr_cashier');

      // 1. Insert main sale record FIRST to satisfy foreign key
      run(
        `INSERT INTO sales (
          id, bill_number, customer_id, cashier_id, subtotal, tax_amount, 
          discount_amount, total_amount, payment_mode, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          billNumber,
          customer_id || null,
          finalCashierId,
          subtotal,
          taxAmount,
          discount,
          totalAmount,
          payment_mode,
          'Completed',
          now
        ]
      );

      // 2. Insert sale items and deduct inventory
      const insertedItems = [];
      for (const it of preparedItems) {
        run(
          `INSERT INTO sale_items (id, sale_id, product_id, product_title, barcode_isbn, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [it.itemId, saleId, it.prodId, it.title, it.barcode_isbn, it.quantity, it.unitPrice, it.lineTotal]
        );

        run('UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?', [it.quantity, it.prodId]);

        insertedItems.push({
          id: it.itemId,
          sale_id: saleId,
          product_id: it.prodId,
          product_title: it.title,
          barcode_isbn: it.barcode_isbn,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          subtotal: it.lineTotal
        });
      }

      // Award customer loyalty reward points & update total spend
      let customerData = null;
      if (customer_id) {
        const earnedPoints = Math.floor(totalAmount / 10); // 1 point per $10 spent
        run(
          'UPDATE customers SET total_purchases = total_purchases + ?, reward_points = reward_points + ? WHERE id = ?',
          [totalAmount, earnedPoints, customer_id]
        );
        customerData = get('SELECT * FROM customers WHERE id = ?', [customer_id]);
      }

      db.exec('COMMIT');

      const fullSale = get(
        `SELECT 
          s.*,
          c.name as customer_name,
          c.phone_number as customer_phone,
          c.email as customer_email,
          c.reward_points as customer_reward_points,
          u.name as cashier_name
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN users u ON s.cashier_id = u.id
         WHERE s.id = ?`,
        [saleId]
      );

      res.status(201).json({
        message: 'Bill created successfully',
        sale: fullSale,
        items: insertedItems,
        customer: customerData
      });
    } catch (txError) {
      db.exec('ROLLBACK');
      throw txError;
    }
  } catch (err) {
    console.error('Error completing checkout:', err);
    res.status(500).json({ error: err.message || 'Checkout failed' });
  }
});

module.exports = router;
