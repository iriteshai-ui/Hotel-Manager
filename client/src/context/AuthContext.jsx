import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [role, setRole] = useState(() => localStorage.getItem('auth_role'));
  const [roles, setRoles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_roles') || '[]'); } catch { return []; }
  });
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_permissions') || '{}'); } catch { return {}; }
  });
  const [accessibleModules, setAccessibleModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_accessible_modules') || '[]'); } catch { return []; }
  });

  const [username, setUsername] = useState(() => localStorage.getItem('auth_username'));
  const [userId, setUserId] = useState(() => localStorage.getItem('auth_user_id'));
  const [hotelId, setHotelId] = useState(() => localStorage.getItem('auth_hotel_id'));
  const [hotelName, setHotelName] = useState(() => localStorage.getItem('auth_hotel_name'));
  const [hotelSlug, setHotelSlug] = useState(() => localStorage.getItem('auth_hotel_slug'));
  const [hotelCurrency, setHotelCurrency] = useState(() => localStorage.getItem('auth_hotel_currency') || 'USD');
  const [fullName, setFullName] = useState(() => localStorage.getItem('auth_full_name'));
  const [email, setEmail] = useState(() => localStorage.getItem('auth_email'));
  const [loading, setLoading] = useState(false);

  // Sync / refresh profile & dynamic permissions from backend
  const refreshUser = async () => {
    const curToken = localStorage.getItem('auth_token');
    if (!curToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'X-Auth-Token': curToken }
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setRoles(data.roles || [data.role]);
        setPermissions(data.permissions || {});
        setAccessibleModules(data.accessibleModules || []);
        setHotelId(data.hotelId || null);
        setHotelName(data.hotelName || null);
        setHotelSlug(data.hotelSlug || null);
        setHotelCurrency(data.hotelCurrency || 'USD');
        setFullName(data.fullName || data.username);
        setEmail(data.email || '');

        localStorage.setItem('auth_role', data.role);
        localStorage.setItem('auth_roles', JSON.stringify(data.roles || [data.role]));
        localStorage.setItem('auth_permissions', JSON.stringify(data.permissions || {}));
        localStorage.setItem('auth_accessible_modules', JSON.stringify(data.accessibleModules || []));
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e.message);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token]);

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
      localStorage.setItem('auth_roles', JSON.stringify(data.roles || [data.role]));
      localStorage.setItem('auth_permissions', JSON.stringify(data.permissions || {}));
      localStorage.setItem('auth_accessible_modules', JSON.stringify(data.accessibleModules || []));
      localStorage.setItem('auth_username', data.username);
      if (data.userId) localStorage.setItem('auth_user_id', data.userId);
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
      setRoles(data.roles || [data.role]);
      setPermissions(data.permissions || {});
      setAccessibleModules(data.accessibleModules || []);
      setUsername(data.username);
      setUserId(data.userId || null);
      setHotelId(data.hotelId || null);
      setHotelName(data.hotelName || null);
      setHotelSlug(data.hotelSlug || null);
      setHotelCurrency(data.hotelCurrency || 'USD');
      setFullName(data.fullName || data.username);
      setEmail(data.email || '');

      window.dispatchEvent(new Event('auth_state_changed'));

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
    localStorage.removeItem('auth_roles');
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('auth_accessible_modules');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_hotel_id');
    localStorage.removeItem('auth_hotel_name');
    localStorage.removeItem('auth_hotel_slug');
    localStorage.removeItem('auth_hotel_currency');
    localStorage.removeItem('auth_full_name');
    localStorage.removeItem('auth_email');

    setToken(null);
    setRole(null);
    setRoles([]);
    setPermissions({});
    setAccessibleModules([]);
    setUsername(null);
    setUserId(null);
    setHotelId(null);
    setHotelName(null);
    setHotelSlug(null);
    setHotelCurrency('USD');
    setFullName(null);
    setEmail(null);

    window.dispatchEvent(new Event('auth_state_changed'));
  };

  const isAuthenticated = !!token;
  const isSuperAdmin = role === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
  const isHotelOwner = role === 'HOTEL_OWNER' || roles.includes('HOTEL_OWNER');
  const isManager = role === 'MANAGER' || roles.includes('MANAGER');
  const isWaiter = role === 'WAITER' || roles.includes('STAFF');
  const isKitchen = role === 'KITCHEN';

  /**
   * RBAC logic commented out as requested to focus on LayBhari users.
   * All modules, actions, and features are unconditionally allowed.
   */
  const hasPermission = (/* moduleCode, action = 'can_view' */) => {
    // RBAC Commented: LayBhari users have full operational access across all features
    /*
    if (isSuperAdmin || isHotelOwner) return true;
    if (!permissions || !permissions[moduleCode]) return false;
    const mod = permissions[moduleCode];
    if (mod.can_manage === true) return true;
    return mod[action] === true;
    */
    return true;
  };

  /**
   * RBAC logic commented out to focus directly on LayBhari users.
   * All navigation modules and screens are accessible.
   */
  const canAccessModule = (/* moduleCode */) => {
    // RBAC Commented: LayBhari users have access to all modules
    /*
    if (isSuperAdmin || isHotelOwner) return true;
    return hasPermission(moduleCode, 'can_view');
    */
    return true;
  };

  return (
    <AuthContext.Provider value={{
      token,
      userId,
      role,
      roles,
      permissions,
      accessibleModules,
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
      refreshUser,
      isAuthenticated,
      isSuperAdmin,
      isHotelOwner,
      isManager,
      isWaiter,
      isKitchen,
      hasPermission,
      canAccessModule
    }}>
      {children}
    </AuthContext.Provider>
  );
};
