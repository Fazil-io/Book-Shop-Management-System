const { get } = require('../db/database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // For convenience in local demo, we can allow session fallback or header
    return next();
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (token) {
    const user = get('SELECT id, name, email, role FROM users WHERE id = ?', [token]);
    if (user) {
      req.user = user;
    }
  }
  next();
}

function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (requiredRole && req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
