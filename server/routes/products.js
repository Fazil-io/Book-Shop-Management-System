const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { all, get, run } = require('../db/database');

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { search, category, status, supplier_id } = req.query;

    let sql = `
      SELECT 
        p.*,
        s.name as supplier_name,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (p.title LIKE ? OR p.barcode_isbn LIKE ? OR p.author_brand LIKE ? OR p.sub_category LIKE ?)`;
      params.push(q, q, q, q);
    }

    if (category && category !== 'All') {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (supplier_id) {
      sql += ` AND p.supplier_id = ?`;
      params.push(supplier_id);
    }

    if (status && status !== 'all') {
      if (status === 'out_of_stock') {
        sql += ` AND p.stock_quantity <= 0`;
      } else if (status === 'low_stock') {
        sql += ` AND p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold`;
      } else if (status === 'in_stock') {
        sql += ` AND p.stock_quantity > p.low_stock_threshold`;
      }
    }

    sql += ` ORDER BY p.title ASC`;

    const products = all(sql, params);
    res.json({ products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = get(
    `SELECT p.*, s.name as supplier_name,
      CASE 
        WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
      END as stock_status
     FROM products p
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product });
});

// POST /api/products
router.post('/', (req, res) => {
  try {
    const {
      barcode_isbn,
      title,
      author_brand,
      category,
      sub_category,
      price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      supplier_id
    } = req.body;

    if (!barcode_isbn || !title || !category || price == null) {
      return res.status(400).json({ error: 'Barcode/ISBN, Title, Category, and Price are required' });
    }

    // Check barcode uniqueness
    const existing = get('SELECT id FROM products WHERE barcode_isbn = ?', [barcode_isbn.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'A product with this Barcode/ISBN already exists' });
    }

    const id = 'prod_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    run(
      `INSERT INTO products (
        id, barcode_isbn, title, author_brand, category, sub_category,
        price, cost_price, stock_quantity, low_stock_threshold, supplier_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        barcode_isbn.trim(),
        title.trim(),
        author_brand ? author_brand.trim() : null,
        category,
        sub_category ? sub_category.trim() : null,
        parseFloat(price) || 0,
        parseFloat(cost_price) || 0,
        parseInt(stock_quantity, 10) || 0,
        parseInt(low_stock_threshold, 10) || 5,
        supplier_id || null,
        now
      ]
    );

    const created = get(
      `SELECT p.*, s.name as supplier_name,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    res.status(201).json({ product: created, message: 'Product created successfully' });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      barcode_isbn,
      title,
      author_brand,
      category,
      sub_category,
      price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      supplier_id
    } = req.body;

    const existing = get('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check barcode collision with another product
    if (barcode_isbn) {
      const duplicate = get('SELECT id FROM products WHERE barcode_isbn = ? AND id != ?', [barcode_isbn.trim(), id]);
      if (duplicate) {
        return res.status(409).json({ error: 'Another product already uses this Barcode/ISBN' });
      }
    }

    run(
      `UPDATE products SET
        barcode_isbn = COALESCE(?, barcode_isbn),
        title = COALESCE(?, title),
        author_brand = COALESCE(?, author_brand),
        category = COALESCE(?, category),
        sub_category = COALESCE(?, sub_category),
        price = COALESCE(?, price),
        cost_price = COALESCE(?, cost_price),
        stock_quantity = COALESCE(?, stock_quantity),
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        supplier_id = ?
       WHERE id = ?`,
      [
        barcode_isbn ? barcode_isbn.trim() : null,
        title ? title.trim() : null,
        author_brand ? author_brand.trim() : null,
        category || null,
        sub_category ? sub_category.trim() : null,
        price != null ? parseFloat(price) : null,
        cost_price != null ? parseFloat(cost_price) : null,
        stock_quantity != null ? parseInt(stock_quantity, 10) : null,
        low_stock_threshold != null ? parseInt(low_stock_threshold, 10) : null,
        supplier_id || null,
        id
      ]
    );

    const updated = get(
      `SELECT p.*, s.name as supplier_name,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    res.json({ product: updated, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH /api/products/:id/stock (Quick Stock Adjustment)
router.patch('/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { delta, new_quantity } = req.body;

    const product = get('SELECT id, stock_quantity, low_stock_threshold FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let finalStock = product.stock_quantity;
    if (new_quantity !== undefined && new_quantity !== null) {
      finalStock = Math.max(0, parseInt(new_quantity, 10) || 0);
    } else if (delta !== undefined && delta !== null) {
      finalStock = Math.max(0, product.stock_quantity + parseInt(delta, 10));
    }

    run('UPDATE products SET stock_quantity = ? WHERE id = ?', [finalStock, id]);

    const updated = get(
      `SELECT p.*, s.name as supplier_name,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
       FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    res.json({ product: updated, message: `Stock updated to ${finalStock}` });
  } catch (err) {
    console.error('Error adjusting stock:', err);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = get('SELECT id, title FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if sales reference this product
    const salesCount = get('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?', [id])?.count || 0;
    if (salesCount > 0) {
      return res.status(400).json({
        error: `Cannot delete "${product.title}" because it is referenced in ${salesCount} historical bill(s). Consider setting stock to 0 instead.`
      });
    }

    run('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: `Product "${product.title}" deleted successfully` });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
