import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [role, setRole] = useState(() => localStorage.getItem('auth_role'));
  const [username, setUsername] = useState(() => localStorage.getItem('auth_username'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_role', data.role);
      localStorage.setItem('auth_username', data.username);
      setToken(data.token);
      setRole(data.role);
      setUsername(data.username);
      return { success: true, role: data.role };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'X-Auth-Token': token },
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_username');
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  const isAuthenticated = !!token;
  const isManager = role === 'MANAGER';
  const isWaiter = role === 'WAITER';
  const isKitchen = role === 'KITCHEN';

  return (
    <AuthContext.Provider value={{ token, role, username, loading, login, logout, isAuthenticated, isManager, isWaiter, isKitchen }}>
      {children}
    </AuthContext.Provider>
  );
};
