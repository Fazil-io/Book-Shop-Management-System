import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, ShieldCheck, ShoppingBag, Sun, Moon, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginView() {
  const { login, quickLogin } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuick = async (role) => {
    setError('');
    setSubmitting(true);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Theme toggle in top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {isDark ? <Sun size={13} color="#F5A623" /> : <Moon size={13} color="#5C5248" />}
            <span>{isDark ? 'Obsidian' : 'Parchment'}</span>
          </button>
        </div>

        {/* Brand */}
        <div className="login-brand">
          <div className="brand-icon">
            <BookOpen size={24} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', letterSpacing: '0.04em' }}>
            VIJAY BOOK STORE
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Books & Stationery Store Management System
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--status-danger-bg)', 
            color: 'var(--status-danger)', 
            padding: '0.65rem 0.85rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.8rem', 
            marginBottom: '1rem',
            border: '1px solid var(--status-danger-border)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. admin@bookhaven.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick RBAC Switchers */}
        <div className="login-quick-roles">
          <p>Instant Role-Based Access (Demo Logins)</p>
          <div className="quick-role-buttons">
            <button 
              type="button"
              className="quick-role-btn" 
              onClick={() => handleQuick('admin')}
              disabled={submitting}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-gold)' }}>
                <ShieldCheck size={16} />
                <span>Store Admin</span>
              </div>
              <span>Full CRUD & Analytics</span>
            </button>

            <button 
              type="button"
              className="quick-role-btn" 
              onClick={() => handleQuick('cashier')}
              disabled={submitting}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--status-info)' }}>
                <ShoppingBag size={16} />
                <span>Billing Cashier</span>
              </div>
              <span>High-speed POS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
