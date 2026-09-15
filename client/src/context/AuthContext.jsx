import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    const savedToken = localStorage.getItem('fq_token');
    if (!savedToken) {
      // Default initial demo user: Admin Eleanor Vance for instant view
      setUser({
        id: 'usr_admin',
        name: 'Eleanor Vance (Head Curator)',
        email: 'admin@bookhaven.com',
        role: 'admin'
      });
      localStorage.setItem('fq_token', 'usr_admin');
      setLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${savedToken}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          // Fallback demo user
          setUser({
            id: 'usr_admin',
            name: 'Eleanor Vance',
            email: 'admin@bookhaven.com',
            role: 'admin'
          });
        }
      })
      .catch(() => {
        setUser({
          id: 'usr_admin',
          name: 'Eleanor Vance',
          email: 'admin@bookhaven.com',
          role: 'admin'
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authenticate');
    }

    setUser(data.user);
    localStorage.setItem('fq_token', data.token);
    return data.user;
  };

  const quickLogin = async (role) => {
    if (role === 'admin') {
      return login('admin@bookhaven.com', 'admin123');
    } else {
      return login('cashier@bookhaven.com', 'cashier123');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fq_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
