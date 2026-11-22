import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

import Manager  from './pages/ManagerDashboard';
import Menu     from './pages/CustomerMenu';
import Kitchen  from './pages/KitchenDisplay';
import Waiter   from './pages/WaiterDashboard';
import Home     from './pages/Home';
import Login    from './pages/Login';
import HotelOnboarding from './pages/HotelOnboarding';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HotelOwnerDashboard from './pages/HotelOwnerDashboard';
import TableOrderManagement from './pages/TableOrderManagement';

function ProtectedRoute({ children, roles = [], module = null }) {
  const { isAuthenticated, role, roles: userRoles, isSuperAdmin, canAccessModule } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super Admin has universal wildcard access
  if (isSuperAdmin) {
    return children;
  }

  // If module check specified, verify dynamic RBAC permissions from Supabase
  if (module && !canAccessModule(module)) {
    return <Navigate to="/" replace />;
  }

  // If specific role list specified, verify user has at least one of those roles
  if (roles.length > 0) {
    const hasRole = roles.includes(role) || (userRoles && userRoles.some(r => roles.includes(r)));
    if (!hasRole) {
      if (role === 'HOTEL_OWNER') return <Navigate to="/hotel-dashboard" replace />;
      if (role === 'MANAGER') return <Navigate to="/manager" replace />;
      if (role === 'WAITER') return <Navigate to="/waiter" replace />;
      if (role === 'KITCHEN') return <Navigate to="/kitchen" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/onboarding" element={<HotelOnboarding />} />
      <Route path="/" element={<Home />} />
      <Route path="/superadmin" element={
        <ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>
      } />
      <Route path="/hotel-dashboard" element={
        <ProtectedRoute roles={['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'SUPER_ADMIN']}><HotelOwnerDashboard /></ProtectedRoute>
      } />
      <Route path="/tables/:tableNumber/order" element={
        <ProtectedRoute roles={['HOTEL_OWNER', 'MANAGER', 'WAITER', 'SUPER_ADMIN']}><TableOrderManagement /></ProtectedRoute>
      } />
      <Route path="/pos/table/:tableNumber" element={
        <ProtectedRoute roles={['HOTEL_OWNER', 'MANAGER', 'WAITER', 'SUPER_ADMIN']}><TableOrderManagement /></ProtectedRoute>
      } />
      <Route path="/kitchen" element={
        <ProtectedRoute roles={['KITCHEN', 'MANAGER', 'SUPER_ADMIN']}><Kitchen /></ProtectedRoute>
      } />
      <Route path="/waiter" element={
        <ProtectedRoute roles={['WAITER', 'MANAGER', 'STAFF', 'SUPER_ADMIN']}><Waiter /></ProtectedRoute>
      } />
      <Route path="/manager" element={
        <ProtectedRoute roles={['MANAGER', 'HOTEL_OWNER', 'SUPER_ADMIN']}><Manager /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
