const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { seedDatabase } = require('./db/seed');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customers');
const salesRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(authMiddleware);

// Initialize database seed
try {
  seedDatabase();
} catch (err) {
  console.error('Failed to initialize or seed database:', err);
}

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Folio & Quill Book & Stationery Store Management',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Folio & Quill Backend running at http://localhost:${PORT}`);
});
