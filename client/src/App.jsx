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

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(role)) {
    if (role === 'SUPER_ADMIN') return <Navigate to="/superadmin" replace />;
    if (role === 'HOTEL_OWNER') return <Navigate to="/hotel-dashboard" replace />;
    if (role === 'MANAGER') return <Navigate to="/manager" replace />;
    if (role === 'WAITER') return <Navigate to="/waiter" replace />;
    if (role === 'KITCHEN') return <Navigate to="/kitchen" replace />;
    return <Navigate to="/" replace />;
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
        <ProtectedRoute roles={['HOTEL_OWNER', 'SUPER_ADMIN']}><HotelOwnerDashboard /></ProtectedRoute>
      } />
      <Route path="/kitchen" element={
        <ProtectedRoute roles={['KITCHEN', 'MANAGER', 'SUPER_ADMIN']}><Kitchen /></ProtectedRoute>
      } />
      <Route path="/waiter" element={
        <ProtectedRoute roles={['WAITER', 'MANAGER', 'SUPER_ADMIN']}><Waiter /></ProtectedRoute>
      } />
      <Route path="/manager" element={
        <ProtectedRoute roles={['MANAGER', 'SUPER_ADMIN']}><Manager /></ProtectedRoute>
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
