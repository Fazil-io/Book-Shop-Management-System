const express = require('express');
const router = express.Router();
const { all, get } = require('../db/database');

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Key Metrics Cards
    // Today's Sales & Revenue
    const todayMetrics = get(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
       FROM sales 
       WHERE date(created_at) = date('now', 'localtime') OR date(created_at) = ?`,
      [todayStr]
    );

    // Total Revenue All-Time
    const totalRev = get('SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM sales');

    // Total Customers
    const customerStats = get('SELECT COUNT(*) as total_customers, COALESCE(SUM(reward_points), 0) as total_reward_points FROM customers');

    // Low Stock Items (< threshold) and Out of stock (<= 0)
    const lowStockAlerts = all(
      `SELECT id, title, barcode_isbn, category, stock_quantity, low_stock_threshold
       FROM products
       WHERE stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`
    );

    // Products inventory counts
    const catalogStats = get(
      `SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN category = 'Book' THEN 1 ELSE 0 END) as total_books,
        SUM(CASE WHEN category = 'Stationery' THEN 1 ELSE 0 END) as total_stationery,
        COALESCE(SUM(CASE WHEN stock_quantity > 0 THEN stock_quantity * price ELSE 0 END), 0) as inventory_retail_value,
        COALESCE(SUM(CASE WHEN stock_quantity > 0 THEN stock_quantity * cost_price ELSE 0 END), 0) as inventory_cost_value
       FROM products`
    );

    // 2. Sales & Revenue Trends:
    // A. Daily (Last 7 Days)
    const dailyTrends = all(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(date, '+1 day')
        FROM dates
        WHERE date < date('now')
      )
      SELECT 
        dates.date as label,
        COALESCE(SUM(sales.total_amount), 0) as revenue,
        COUNT(sales.id) as orders
      FROM dates
      LEFT JOIN sales ON date(sales.created_at) = dates.date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `);

    // B. Weekly (Last 4 Weeks)
    const weeklyTrends = all(`
      SELECT 
        strftime('%Y-W%W', created_at) as label,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(id) as orders
      FROM sales
      WHERE created_at >= date('now', '-28 days')
      GROUP BY label
      ORDER BY label ASC
    `);

    // C. Monthly (Last 6 Months)
    const monthlyTrends = all(`
      SELECT 
        strftime('%Y-%m', created_at) as label,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(id) as orders
      FROM sales
      WHERE created_at >= date('now', '-180 days')
      GROUP BY label
      ORDER BY label ASC
    `);

    // 3. Payment Mode Breakdown
    const paymentBreakdown = all(`
      SELECT 
        payment_mode,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
      FROM sales
      GROUP BY payment_mode
    `);

    // 4. Category Revenue Breakdown (Books vs Stationery)
    const categoryBreakdown = all(`
      SELECT 
        p.category,
        COALESCE(SUM(si.subtotal), 0) as revenue,
        COALESCE(SUM(si.quantity), 0) as units_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.category
    `);

    // 5. Top 5 Best Sellers
    const topSellers = all(`
      SELECT 
        si.product_id,
        si.product_title,
        p.category,
        p.price,
        SUM(si.quantity) as total_qty,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY si.product_id, si.product_title
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    // 6. Recent Sales Activity (last 6 transactions)
    const recentTransactions = all(`
      SELECT 
        s.id,
        s.bill_number,
        s.total_amount,
        s.payment_mode,
        s.created_at,
        c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 6
    `);

    res.json({
      metrics: {
        todaySales: todayMetrics?.total || 0,
        todayOrders: todayMetrics?.count || 0,
        totalRevenue: totalRev?.total_revenue || 0,
        totalOrders: totalRev?.total_orders || 0,
        lowStockCount: lowStockAlerts.length,
        totalCustomers: customerStats?.total_customers || 0,
        catalog: catalogStats
      },
      lowStockAlerts,
      charts: {
        daily: dailyTrends,
        weekly: weeklyTrends,
        monthly: monthlyTrends
      },
      paymentBreakdown,
      categoryBreakdown,
      topSellers,
      recentTransactions
    });
  } catch (err) {
    console.error('Error fetching analytics overview:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/analytics/reset-all
router.post('/reset-all', (req, res) => {
  try {
    const { resetStock = false } = req.body || {};
    const { db } = require('../db/database');
    db.exec('BEGIN TRANSACTION');

    // 1. Wipe all sale items
    db.exec('DELETE FROM sale_items;');

    // 2. Wipe all sales records
    db.exec('DELETE FROM sales;');

    // 3. Reset customers purchase totals and reward points to 0
    db.exec('UPDATE customers SET total_purchases = 0, reward_points = 0;');

    // 4. Optionally reset product stock quantities to 0
    if (resetStock) {
      db.exec('UPDATE products SET stock_quantity = 0;');
    }

    db.exec('COMMIT');

    res.json({
      success: true,
      message: 'All sales, orders, and customer transaction data successfully reset to 0.',
      stockReset: resetStock
    });
  } catch (err) {
    const { db } = require('../db/database');
    try { db.exec('ROLLBACK'); } catch (_) {}
    console.error('Error resetting data:', err);
    res.status(500).json({ error: 'Failed to reset store data' });
  }
});

module.exports = router;
