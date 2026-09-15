import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users, 
  FileText, 
  ShoppingBag, 
  Sun, 
  Moon, 
  LogOut,
  ArrowRightLeft
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, quickLogin } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const isAdmin = user?.role === 'admin';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-wrapper" onClick={() => setActiveTab(isAdmin ? 'overview' : 'pos')}>
          <div className="brand-icon">
            <BookOpen size={20} />
          </div>
          <div className="brand-text">
            <h1>VIJAY</h1>
            <p>Book Store</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {isAdmin ? (
            <>
              <button
                className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
                title="Overview"
              >
                <LayoutDashboard size={15} />
                <span className="nav-label">Overview</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
                title="Inventory"
              >
                <Package size={15} />
                <span className="nav-label">Inventory</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
                onClick={() => setActiveTab('suppliers')}
                title="Suppliers"
              >
                <Truck size={15} />
                <span className="nav-label">Suppliers</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
                title="Customers"
              >
                <Users size={15} />
                <span className="nav-label">Customers</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
                title="Sales Reports"
              >
                <FileText size={15} />
                <span className="nav-label">Reports</span>
              </button>

              <button
                className={`nav-tab-btn pos-tab ${activeTab === 'pos' ? 'active' : ''}`}
                onClick={() => setActiveTab('pos')}
                title="Cashier POS"
              >
                <ShoppingBag size={15} />
                <span className="nav-label">POS</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
                onClick={() => setActiveTab('pos')}
              >
                <ShoppingBag size={15} />
                <span className="nav-label">Billing POS</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
              >
                <Users size={15} />
                <span className="nav-label">Customers</span>
              </button>
            </>
          )}
        </nav>

        {/* Controls */}
        <div className="nav-actions">
          {/* Quick Role Switcher */}
          <button 
            className="btn btn-secondary btn-sm nav-role-btn"
            onClick={() => quickLogin(isAdmin ? 'cashier' : 'admin')}
            title={`Switch to ${isAdmin ? 'Cashier' : 'Admin'} Role`}
          >
            <ArrowRightLeft size={13} />
            <span className="nav-label">{isAdmin ? 'Cashier' : 'Admin'}</span>
          </button>

          {/* Theme Switcher */}
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={14} color="#FBBF24" /> : <Moon size={14} />}
          </button>

          {/* User Profile */}
          <div className="user-profile-pill">
            <div className="user-avatar">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="user-meta">
              <span className="user-name">{user?.name?.split(' ')[0]}</span>
              <span className={`user-role-badge ${user?.role}`}>{user?.role}</span>
            </div>
            <button 
              className="btn-logout" 
              onClick={logout} 
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
