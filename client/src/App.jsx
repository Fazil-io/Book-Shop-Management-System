import React, { useState, useEffect } from 'react';
import './styles/main.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import OverviewTab from './views/AdminDashboard/OverviewTab';
import InventoryTab from './views/AdminDashboard/InventoryTab';
import SupplierTab from './views/AdminDashboard/SupplierTab';
import CustomerTab from './views/AdminDashboard/CustomerTab';
import ReportsTab from './views/AdminDashboard/ReportsTab';
import BillingView from './views/CashierPOS/BillingView';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Adjust active tab if user role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'cashier') {
        setActiveTab('pos');
      } else if (user.role === 'admin' && activeTab === 'pos') {
        // Keep pos if user switched or set to overview
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Opening Vijay Book Store Registry...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'overview' && user.role === 'admin' && (
          <OverviewTab onNavigateTab={setActiveTab} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab />
        )}
        {activeTab === 'suppliers' && (
          <SupplierTab />
        )}
        {activeTab === 'customers' && (
          <CustomerTab />
        )}
        {activeTab === 'reports' && (
          <ReportsTab />
        )}
        {activeTab === 'pos' && (
          <BillingView />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
