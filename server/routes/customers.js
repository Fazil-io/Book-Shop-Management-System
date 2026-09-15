const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { all, get, run } = require('../db/database');

// GET /api/customers
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (name LIKE ? OR phone_number LIKE ? OR email LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY total_purchases DESC, name ASC';
    const customers = all(sql, params);
    res.json({ customers });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/lookup?phone=...
router.get('/lookup', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number parameter is required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const customer = get('SELECT * FROM customers WHERE phone_number LIKE ?', [`%${cleanPhone}%`]);
    res.json({ customer: customer || null });
  } catch (err) {
    console.error('Error in customer lookup:', err);
    res.status(500).json({ error: 'Customer lookup failed' });
  }
});

// GET /api/customers/:id (with purchase history)
router.get('/:id', (req, res) => {
  try {
    const customer = get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const sales = all(
      `SELECT s.*, u.name as cashier_name 
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.id
       WHERE s.customer_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );

    // Attach sale items for each past sale
    for (const sale of sales) {
      sale.items = all('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    }

    res.json({ customer, sales });
  } catch (err) {
    console.error('Error fetching customer details:', err);
    res.status(500).json({ error: 'Failed to fetch customer history' });
  }
});

// POST /api/customers
router.post('/', (req, res) => {
  try {
    const { name, phone_number, email } = req.body;
    if (!name || !phone_number) {
      return res.status(400).json({ error: 'Customer Name and Phone Number are required' });
    }

    const cleanPhone = phone_number.trim().replace(/\D/g, '');
    const existing = get('SELECT id FROM customers WHERE phone_number = ?', [cleanPhone]);
    if (existing) {
      return res.status(409).json({ error: 'Customer with this phone number already registered' });
    }

    const id = 'cust_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    run(
      'INSERT INTO customers (id, name, phone_number, email, reward_points, total_purchases, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name.trim(), cleanPhone, email ? email.trim() : null, 10, 0, now] // 10 welcome points!
    );

    const created = get('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json({ customer: created, message: 'Customer registered with 10 welcome reward points!' });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Failed to register customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone_number, email, reward_points } = req.body;

    const existing = get('SELECT id FROM customers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let cleanPhone = null;
    if (phone_number) {
      cleanPhone = phone_number.trim().replace(/\D/g, '');
      const duplicate = get('SELECT id FROM customers WHERE phone_number = ? AND id != ?', [cleanPhone, id]);
      if (duplicate) {
        return res.status(409).json({ error: 'Another customer is already registered with this phone number' });
      }
    }

    run(
      `UPDATE customers SET
        name = COALESCE(?, name),
        phone_number = COALESCE(?, phone_number),
        email = COALESCE(?, email),
        reward_points = COALESCE(?, reward_points)
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        cleanPhone,
        email ? email.trim() : null,
        reward_points != null ? parseInt(reward_points, 10) : null,
        id
      ]
    );

    const updated = get('SELECT * FROM customers WHERE id = ?', [id]);
    res.json({ customer: updated, message: 'Customer details updated' });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

module.exports = router;
