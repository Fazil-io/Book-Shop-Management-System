const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { all, get, run } = require('../db/database');

// GET /api/suppliers
router.get('/', (req, res) => {
  try {
    const suppliers = all(`
      SELECT 
        s.*,
        COUNT(p.id) as product_count,
        SUM(CASE WHEN p.stock_quantity <= p.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_products
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);
    res.json({ suppliers });
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', (req, res) => {
  try {
    const supplier = get('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const products = all('SELECT id, title, category, price, stock_quantity FROM products WHERE supplier_id = ?', [req.params.id]);
    res.json({ supplier, products });
  } catch (err) {
    console.error('Error fetching supplier:', err);
    res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
});

// POST /api/suppliers
router.post('/', (req, res) => {
  try {
    const { name, contact_person, phone, email, address, supplied_categories } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const id = 'sup_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    run(
      `INSERT INTO suppliers (id, name, contact_person, phone, email, address, supplied_categories, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        contact_person ? contact_person.trim() : null,
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null,
        supplied_categories ? supplied_categories.trim() : null,
        now
      ]
    );

    const created = get('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.status(201).json({ supplier: created, message: 'Supplier added successfully' });
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, supplied_categories } = req.body;

    const existing = get('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    run(
      `UPDATE suppliers SET
        name = COALESCE(?, name),
        contact_person = COALESCE(?, contact_person),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        supplied_categories = COALESCE(?, supplied_categories)
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        contact_person ? contact_person.trim() : null,
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null,
        supplied_categories ? supplied_categories.trim() : null,
        id
      ]
    );

    const updated = get('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.json({ supplier: updated, message: 'Supplier updated successfully' });
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const supplier = get('SELECT id, name FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Unlink products
    run('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?', [id]);
    run('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({ message: `Supplier "${supplier.name}" removed successfully` });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

module.exports = router;
