import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [role, setRole] = useState(() => localStorage.getItem('auth_role'));
  const [username, setUsername] = useState(() => localStorage.getItem('auth_username'));
  const [hotelId, setHotelId] = useState(() => localStorage.getItem('auth_hotel_id'));
  const [hotelName, setHotelName] = useState(() => localStorage.getItem('auth_hotel_name'));
  const [hotelSlug, setHotelSlug] = useState(() => localStorage.getItem('auth_hotel_slug'));
  const [hotelCurrency, setHotelCurrency] = useState(() => localStorage.getItem('auth_hotel_currency') || 'USD');
  const [fullName, setFullName] = useState(() => localStorage.getItem('auth_full_name'));
  const [email, setEmail] = useState(() => localStorage.getItem('auth_email'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Invalid credentials');
      }
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_role', data.role);
      localStorage.setItem('auth_username', data.username);
      if (data.hotelId) localStorage.setItem('auth_hotel_id', data.hotelId);
      else localStorage.removeItem('auth_hotel_id');
      if (data.hotelName) localStorage.setItem('auth_hotel_name', data.hotelName);
      else localStorage.removeItem('auth_hotel_name');
      if (data.hotelSlug) localStorage.setItem('auth_hotel_slug', data.hotelSlug);
      else localStorage.removeItem('auth_hotel_slug');
      if (data.hotelCurrency) localStorage.setItem('auth_hotel_currency', data.hotelCurrency);
      if (data.fullName) localStorage.setItem('auth_full_name', data.fullName);
      if (data.email) localStorage.setItem('auth_email', data.email);

      setToken(data.token);
      setRole(data.role);
      setUsername(data.username);
      setHotelId(data.hotelId || null);
      setHotelName(data.hotelName || null);
      setHotelSlug(data.hotelSlug || null);
      setHotelCurrency(data.hotelCurrency || 'USD');
      setFullName(data.fullName || data.username);
      setEmail(data.email || '');

      return { success: true, role: data.role, hotelSlug: data.hotelSlug };
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
    localStorage.removeItem('auth_hotel_id');
    localStorage.removeItem('auth_hotel_name');
    localStorage.removeItem('auth_hotel_slug');
    localStorage.removeItem('auth_hotel_currency');
    localStorage.removeItem('auth_full_name');
    localStorage.removeItem('auth_email');

    setToken(null);
    setRole(null);
    setUsername(null);
    setHotelId(null);
    setHotelName(null);
    setHotelSlug(null);
    setHotelCurrency('USD');
    setFullName(null);
    setEmail(null);
  };

  const isAuthenticated = !!token;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isHotelOwner = role === 'HOTEL_OWNER';
  const isManager = role === 'MANAGER';
  const isWaiter = role === 'WAITER';
  const isKitchen = role === 'KITCHEN';

  return (
    <AuthContext.Provider value={{
      token,
      role,
      username,
      hotelId,
      hotelName,
      hotelSlug,
      hotelCurrency,
      fullName,
      email,
      loading,
      login,
      logout,
      isAuthenticated,
      isSuperAdmin,
      isHotelOwner,
      isManager,
      isWaiter,
      isKitchen
    }}>
      {children}
    </AuthContext.Provider>
  );
};
