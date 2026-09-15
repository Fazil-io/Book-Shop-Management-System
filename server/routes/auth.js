const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = get('SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Token is user ID for simplicity & persistence
  const token = user.id;

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const user = get('SELECT id, name, email, role FROM users WHERE id = ?', [token]);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or user not found' });
  }
  res.json({ user });
});

// GET /api/auth/demo-users (helpful for instant one-click login testing)
router.get('/demo-users', (req, res) => {
  const users = all('SELECT id, name, email, role FROM users ORDER BY role ASC');
  res.json({ users });
});

module.exports = router;
