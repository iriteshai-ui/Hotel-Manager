import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Users, BedDouble, CalendarCheck, DollarSign, TrendingUp, 
  Settings, FileText, CheckCircle2, XCircle, Search, Plus, ExternalLink, 
  RefreshCw, LogOut, ArrowUpRight, BarChart3, CreditCard, Shield, 
  Clock, Download, Filter, UserCheck, AlertCircle, Wrench, Sparkles, ChevronRight
} from 'lucide-react';

export default function HotelOwnerDashboard() {
  const { logout, username, role, hotelName: authHotelName, hotelCurrency: authCurrency, login } = useAuth();
  const [searchParams] = useSearchParams();
  const hotelIdQuery = searchParams.get('hotelId');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Filters & Search State
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [roomCategoryFilter, setRoomCategoryFilter] = useState('ALL');

  // Modals State
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({
    guestName: '', guestEmail: '', guestPhone: '', roomNumber: '', roomCategory: 'Standard Room',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    totalAmount: 360, paidAmount: 360, paymentStatus: 'PAID', bookingSource: 'DIRECT', paymentMethod: 'CARD'
  });

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    roomNumber: '', category: 'Deluxe Suite', pricePerNight: 280, floor: 2, amenities: 'Ocean View, Wi-Fi'
  });

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '', role: 'Front Desk Associate', email: '', phone: '', shift: 'MORNING'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    const headers = { 'X-Auth-Token': token };
    if (hotelIdQuery) headers['x-hotel-id'] = hotelIdQuery;
    return headers;
  };

  const getQueryUrl = (base) => {
    return hotelIdQuery ? `${base}?hotelId=${hotelIdQuery}` : base;
  };

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Fetch Dashboard Overview
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/dashboard'), { headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load hotel dashboard.');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const url = hotelIdQuery 
        ? `/api/hotel-owner/analytics?hotelId=${hotelIdQuery}&range=${dateRange}`
        : `/api/hotel-owner/analytics?range=${dateRange}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) setAnalyticsData(await res.json());
    } catch (e) { console.error(e); }
  };

  // 3. Fetch Bookings
  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (hotelIdQuery) params.append('hotelId', hotelIdQuery);
      if (bookingStatusFilter !== 'ALL') params.append('status', bookingStatusFilter);
      if (bookingSearch.trim()) params.append('search', bookingSearch.trim());

      const res = await fetch(`/api/hotel-owner/bookings?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) setBookings(await res.json());
    } catch (e) { console.error(e); }
  };

  // 4. Fetch Rooms
  const fetchRooms = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/rooms'), { headers: getAuthHeaders() });
      if (res.ok) setRooms(await res.json());
    } catch (e) { console.error(e); }
  };

  // 5. Fetch Customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/customers'), { headers: getAuthHeaders() });
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
  };

  // 6. Fetch Financials
  const fetchFinancials = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/financials'), { headers: getAuthHeaders() });
      if (res.ok) setFinancials(await res.json());
    } catch (e) { console.error(e); }
  };

  // 7. Fetch Staff
  const fetchStaff = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/staff'), { headers: getAuthHeaders() });
      if (res.ok) setStaff(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics();
    fetchBookings();
    fetchRooms();
    fetchCustomers();
    fetchFinancials();
    fetchStaff();
  }, [hotelIdQuery]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  useEffect(() => {
    fetchBookings();
  }, [bookingStatusFilter, bookingSearch]);

  // Actions
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/hotel-owner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Booking status updated to ${newStatus}`);
        fetchBookings();
        fetchDashboard();
      }
    } catch {
      showToast('Failed to update booking status', 'error');
    }
  };

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      const res = await fetch(`/api/hotel-owner/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Room marked as ${newStatus}`);
        fetchRooms();
        fetchDashboard();
      }
    } catch {
      showToast('Failed to update room', 'error');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newBookingForm)
      });
      if (res.ok) {
        showToast('New booking confirmed and recorded!');
        setShowNewBookingModal(false);
        fetchBookings();
        fetchDashboard();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to book room', 'error');
      }
    } catch {
      showToast('Network error creating booking', 'error');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = newRoomForm.amenities.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(getQueryUrl('/api/hotel-owner/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          roomNumber: newRoomForm.roomNumber,
          category: newRoomForm.category,
          pricePerNight: newRoomForm.pricePerNight,
          floor: newRoomForm.floor,
          amenities: amenitiesArr
        })
      });
      if (res.ok) {
        showToast(`Room ${newRoomForm.roomNumber} added to inventory!`);
        setShowAddRoomModal(false);
        fetchRooms();
        fetchDashboard();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create room', 'error');
      }
    } catch {
      showToast('Error creating room', 'error');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/staff'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newStaffForm)
      });
      if (res.ok) {
        showToast(`Staff member "${newStaffForm.name}" registered!`);
        setShowAddStaffModal(false);
        fetchStaff();
      }
    } catch {
      showToast('Failed to register staff', 'error');
    }
  };

  // Demo Switcher helper to easily showcase multi-tenancy
  const handleQuickDemoSwitch = async (u, p) => {
    setLoading(true);
    await login(u, p);
    navigate(u === 'superadmin' ? '/superadmin' : '/hotel-dashboard');
    window.location.reload();
  };

  const currencySymbol = dashboardData?.hotel?.currency === 'EUR' ? '€' : 
                         dashboardData?.hotel?.currency === 'INR' ? '₹' : 
                         dashboardData?.hotel?.currency === 'GBP' ? '£' : '$';

  const navItems = [
    { id: 'overview', label: 'Business Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Sales & Revenue', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings Management', icon: CalendarCheck },
    { id: 'rooms', label: 'Room Inventory', icon: BedDouble },
    { id: 'customers', label: 'Guests & Customers', icon: Users },
    { id: 'financials', label: 'Financial Reports', icon: FileText },
    { id: 'staff', label: 'Staff & Operations', icon: UserCheck },
    { id: 'settings', label: 'Property Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row antialiased">
      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="w-full md:w-72 bg-[#0F172A] text-white flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          {/* Hotel Identity */}
          <div className="flex items-center gap-3 mb-6">
            <div 
              style={{ backgroundColor: dashboardData?.hotel?.theme?.primaryColor || '#D97706' }}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg"
            >
              {dashboardData?.hotel?.name ? dashboardData.hotel.name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-black tracking-tight text-white truncate">
                {dashboardData?.hotel?.name || authHotelName || 'Hotel Dashboard'}
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Tenant: {dashboardData?.hotel?.slug || 'isolated'}
              </p>
            </div>
          </div>

          {/* Strict Isolation Notice Card */}
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">Tenant Data Isolation</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Strictly restricted to <strong>{dashboardData?.hotel?.name || 'Assigned Hotel'}</strong> records.
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-black' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer User Info */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xs font-black text-amber-300">
                HO
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{username}</p>
                <p className="text-[10px] text-slate-400 font-medium">Hotel Owner Role</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {role === 'SUPER_ADMIN' && (
            <button
              onClick={() => navigate('/superadmin')}
              className="w-full py-2 mb-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold text-center block transition-all"
            >
              Back to Super Admin ↗
            </button>
          )}

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Currency: {dashboardData?.hotel?.currency || 'USD'} ({currencySymbol})
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header & Demo Switcher Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
                {dashboardData?.hotel?.name || 'Hotel Management Dashboard'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase font-mono">
                {dashboardData?.hotel?.currency || 'USD'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time room occupancy, reservations, and financial ledger
            </p>
          </div>

          {/* Quick Demo Switcher Pills & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Demo Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
              <span className="text-slate-400 px-2 text-[10px] uppercase font-black">Demo Persona:</span>
              <button
                onClick={() => handleQuickDemoSwitch('owner_hotela', 'password123')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  dashboardData?.hotel?.slug === 'grand-horizon' ? 'bg-white shadow-sm text-blue-700 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hotel A (Grand Horizon)
              </button>
              <button
                onClick={() => handleQuickDemoSwitch('owner_hotelb', 'password123')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  dashboardData?.hotel?.slug === 'royal-palms' ? 'bg-white shadow-sm text-emerald-700 font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hotel B (Royal Palms)
              </button>
            </div>

            {/* Direct Guest Menu Link */}
            {dashboardData?.hotel?.slug && (
              <a
                href={`/menu?hotel=${dashboardData.hotel.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 no-underline"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Guest Menu ↗</span>
              </a>
            )}

            <button
              onClick={() => setShowNewBookingModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Booking</span>
            </button>
          </div>
        </header>

        {/* Status Toast */}
        {toastMsg && (
          <div className="px-8 pt-4">
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              toastMsg.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{toastMsg.text}</span>
            </div>
          </div>
        )}

        {/* Security / Error Screen */}
        {error && (
          <div className="m-8 p-8 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 max-w-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black mb-2">Tenant Access Error</h3>
            <p className="text-xs leading-relaxed mb-6">{error}</p>
            <button
              onClick={() => handleQuickDemoSwitch('owner_hotela', 'password123')}
              className="px-4 py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 cursor-pointer"
            >
              Switch to Valid Hotel A Account
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 1: BUSINESS OVERVIEW (Main KPI Cards & Widgets)         */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && dashboardData && (
          <div className="p-8 space-y-8 animate-fade-in">
            {/* 10 Core Business Overview KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* 1. Today's Sales */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Today's Sales</span>
                <span className="text-2xl font-black text-slate-900">{currencySymbol}{dashboardData.kpis.todaySales.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1 flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> Invoiced today
                </span>
              </div>

              {/* 2. Total Revenue */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Revenue</span>
                <span className="text-2xl font-black text-slate-900">{currencySymbol}{dashboardData.kpis.totalRevenue.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 block mt-1">Confirmed ledger</span>
              </div>

              {/* 3. Monthly Revenue */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Monthly Revenue</span>
                <span className="text-2xl font-black text-indigo-600">{currencySymbol}{dashboardData.kpis.monthlyRevenue.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-indigo-500 block mt-1">Current month</span>
              </div>

              {/* 4. Total Bookings */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Bookings</span>
                <span className="text-2xl font-black text-slate-900">{dashboardData.kpis.totalBookings}</span>
                <span className="text-[10px] font-bold text-slate-400 block mt-1">Lifetime guests</span>
              </div>

              {/* 5. Room Occupancy % */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Occupancy Rate</span>
                <span className="text-2xl font-black text-amber-600">{dashboardData.kpis.occupancyPercentage}%</span>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(dashboardData.kpis.occupancyPercentage, 100)}%` }} />
                </div>
              </div>

              {/* 6. Today's Check-ins */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Today's Check-ins</span>
                <span className="text-2xl font-black text-emerald-600">{dashboardData.kpis.todayCheckIns}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Arriving guests</span>
              </div>

              {/* 7. Today's Check-outs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Today's Check-outs</span>
                <span className="text-2xl font-black text-slate-700">{dashboardData.kpis.todayCheckOuts}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Departing guests</span>
              </div>

              {/* 8. Occupied Rooms */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Occupied Rooms</span>
                <span className="text-2xl font-black text-rose-600">{dashboardData.kpis.occupiedRooms}</span>
                <span className="text-[10px] text-slate-400 block mt-1">of {dashboardData.kpis.totalRooms} total rooms</span>
              </div>

              {/* 9. Available Rooms */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Available Rooms</span>
                <span className="text-2xl font-black text-emerald-600">{dashboardData.kpis.availableRooms}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Ready for check-in</span>
              </div>

              {/* 10. Average Room Revenue (ADR) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Avg Room Rev (ADR)</span>
                <span className="text-2xl font-black text-slate-900">{currencySymbol}{dashboardData.kpis.averageRoomRevenue}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Per booking average</span>
              </div>
            </div>

            {/* Recent Bookings Table Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Recent Guest Reservations</h3>
                  <p className="text-xs text-slate-500">Live booking feed scoped strictly to this property</p>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Bookings</span> <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Booking Code</th>
                      <th className="py-3.5 px-6">Guest Name</th>
                      <th className="py-3.5 px-6">Room</th>
                      <th className="py-3.5 px-6">Stay Dates</th>
                      <th className="py-3.5 px-6">Total Amount</th>
                      <th className="py-3.5 px-6">Payment</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{b.booking_code}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">{b.guest_name}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-700">
                          Room {b.room_number} <span className="text-[11px] text-slate-400">({b.room_category})</span>
                        </td>
                        <td className="py-3.5 px-6 font-medium text-slate-600">
                          {b.check_in.split('T')[0]} → {b.check_out.split('T')[0]}
                        </td>
                        <td className="py-3.5 px-6 font-black text-slate-900 text-sm">
                          {currencySymbol}{parseFloat(b.total_amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            b.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {b.payment_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.booking_status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            b.booking_status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 2: SALES & REVENUE ANALYTICS (Interactive Charts)       */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="p-8 space-y-8 animate-fade-in">
            {/* Date Range Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Analytics Period:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last_7_days', label: 'Last 7 Days' },
                  { id: 'last_30_days', label: 'Last 30 Days' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'this_year', label: 'This Year' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setDateRange(r.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateRange === r.id
                        ? 'bg-amber-600 text-white shadow-sm font-black'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Sales Trajectory Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">Daily Revenue Timeline</h3>
                  <p className="text-xs text-slate-500">Daily verified guest reservations for this period</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {analyticsData.trends.length} Data Points
                </span>
              </div>

              <div className="h-60 flex items-end gap-4 pt-6 px-4 border-b border-slate-100 overflow-x-auto">
                {analyticsData.trends.map((t, idx) => {
                  const maxSales = Math.max(...analyticsData.trends.map(m => m.sales), 500);
                  const heightPct = Math.max((t.sales / maxSales) * 100, 12);
                  return (
                    <div key={idx} className="flex-1 min-w-[42px] flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-600 transition-colors">
                        {currencySymbol}{t.sales}
                      </span>
                      <div 
                        className="w-full bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-xl group-hover:from-amber-500 group-hover:to-amber-400 transition-all shadow-md shadow-amber-600/10"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 whitespace-nowrap">
                        {t.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown Grid: Room Category + Booking Sources + Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue by Room Category */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900">Revenue by Room Category</h4>
                <div className="space-y-3">
                  {analyticsData.revenueByCategory.map(cat => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700">{cat.category}</span>
                        <span className="text-slate-900">{currencySymbol}{cat.revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full" 
                          style={{ width: `${Math.min((cat.revenue / (dashboardData?.kpis?.totalRevenue || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{cat.bookings} bookings</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Source Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900">Booking Sources</h4>
                <div className="space-y-3">
                  {analyticsData.bookingSources.map(src => (
                    <div key={src.source} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{src.source}</span>
                        <span className="text-[10px] text-slate-400">{src.count} bookings</span>
                      </div>
                      <span className="font-black text-slate-900 text-xs">
                        {currencySymbol}{src.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods (Cash vs Online vs Card) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900">Payment Methods Breakdown</h4>
                <div className="space-y-3">
                  {analyticsData.paymentMethods.map(pay => (
                    <div key={pay.method} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{pay.method}</span>
                        <span className="text-[10px] text-slate-400">{pay.count} transactions</span>
                      </div>
                      <span className="font-black text-slate-900 text-xs">
                        {currencySymbol}{pay.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 3: BOOKINGS MANAGEMENT                                  */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="p-8 space-y-6 animate-fade-in">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest name, booking code, room..."
                  value={bookingSearch}
                  onChange={e => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      bookingStatusFilter === st
                        ? 'bg-amber-600 text-white shadow-sm font-black'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Booking Code</th>
                      <th className="py-3.5 px-6">Guest Contact</th>
                      <th className="py-3.5 px-6">Room / Category</th>
                      <th className="py-3.5 px-6">Check-in / Check-out</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">{b.booking_code}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 text-sm block">{b.guest_name}</span>
                          <span className="text-[11px] text-slate-400">{b.guest_email || b.guest_phone || 'No direct phone'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">Room {b.room_number}</span>
                          <span className="text-[11px] text-slate-400">{b.room_category}</span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">
                          {b.check_in.split('T')[0]} → {b.check_out.split('T')[0]}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black text-slate-900 text-sm">
                            {currencySymbol}{parseFloat(b.total_amount).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-600 block font-bold">{b.payment_status}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.booking_status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            b.booking_status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1.5">
                          {b.booking_status === 'CONFIRMED' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Check-out
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 4: ROOM MANAGEMENT                                      */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'rooms' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Room Inventory & Availability Matrix</h3>
                <p className="text-xs text-slate-500">Live room statuses, floor allocation, and pricing</p>
              </div>
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Room to Inventory
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rooms.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl font-black text-slate-900">#{r.room_number}</span>
                    <select
                      value={r.status}
                      onChange={(e) => handleUpdateRoomStatus(r.id, e.target.value)}
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer ${
                        r.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        r.status === 'OCCUPIED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        r.status === 'RESERVED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 mb-0.5">{r.category}</h4>
                  <p className="text-xs font-black text-slate-900 mb-3">
                    {currencySymbol}{parseFloat(r.price_per_night)} <span className="text-slate-400 font-normal">/ night</span>
                  </p>

                  <div className="flex flex-wrap gap-1 pt-3 border-t border-slate-100">
                    {(r.amenities || []).map((amenity, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 5: CUSTOMER DIRECTORY                                   */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'customers' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-slate-900">Guest & Customer Directory</h3>
              <p className="text-xs text-slate-500">Historical guest profile, contact details, and lifetime spending</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Guest Profile</th>
                    <th className="py-3.5 px-6">Contact Info</th>
                    <th className="py-3.5 px-6">Total Bookings</th>
                    <th className="py-3.5 px-6">Total Lifetime Spend</th>
                    <th className="py-3.5 px-6">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">{c.name}</td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800 block">{c.email || '—'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{c.phone || '—'}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">{c.totalBookings} stay{c.totalBookings === 1 ? '' : 's'}</td>
                      <td className="py-4 px-6 font-black text-slate-900 text-sm">
                        {currencySymbol}{c.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-500">
                        {c.lastVisit ? c.lastVisit.split('T')[0] : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 6: FINANCIAL REPORTS                                    */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'financials' && financials && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Hotel Financial Ledger & Reconciliations</h3>
                <p className="text-xs text-slate-500">Gross sales, collections, refunds, and tax liabilities</p>
              </div>
              <button
                onClick={() => {
                  const csv = `Metric,Amount (${dashboardData?.hotel?.currency || 'USD'})\n` +
                    `Gross Sales,${financials.grossSales}\n` +
                    `Net Sales,${financials.netSales}\n` +
                    `Total Collections,${financials.totalCollections}\n` +
                    `Pending Payments,${financials.pendingPayments}\n` +
                    `Discounts,${financials.totalDiscounts}\n` +
                    `Refunds,${financials.totalRefunds}\n` +
                    `Taxes,${financials.totalTaxes}\n`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${dashboardData?.hotel?.slug || 'hotel'}-financial-ledger.csv`;
                  a.click();
                  showToast('Financial report exported to CSV');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Excel/CSV Report
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gross Invoiced Sales</span>
                <span className="text-2xl font-black text-slate-900">{currencySymbol}{financials.grossSales.toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">Confirmed guest billings</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Net Cleared Sales</span>
                <span className="text-2xl font-black text-emerald-600">{currencySymbol}{financials.netSales.toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">Gross minus discounts & refunds</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Settled Collections</span>
                <span className="text-2xl font-black text-indigo-600">{currencySymbol}{financials.totalCollections.toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">Received via Card, Online & Cash</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pending Receivables</span>
                <span className="text-2xl font-black text-amber-600">{currencySymbol}{financials.pendingPayments.toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">Due upon check-out</p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 7: STAFF & OPERATIONS                                   */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'staff' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Hotel Staff & Daily Operations</h3>
                <p className="text-xs text-slate-500">Concierge, Front Desk, Housekeeping, and Culinary personnel</p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Register Staff Member
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((s) => (
                <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.status}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">{s.name}</h4>
                  <p className="text-xs font-bold text-amber-600 mb-2">{s.role}</p>
                  <div className="text-xs text-slate-500 space-y-0.5 pt-2 border-t border-slate-100">
                    <p>Shift: <strong className="text-slate-700">{s.shift}</strong></p>
                    <p className="font-mono text-[11px]">{s.email || s.phone || 'No direct contact'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 8: PROPERTY SETTINGS                                    */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && dashboardData && (
          <div className="p-8 max-w-2xl space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-slate-900">Property Configuration & Policies</h3>
              <p className="text-xs text-slate-500">Theme tokens, tax percentages, and guest menu configurations</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Property Name</span>
                <span className="text-sm font-bold text-slate-900">{dashboardData.hotel.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Tenant Slug</span>
                <span className="text-sm font-mono text-indigo-600 font-bold">/{dashboardData.hotel.slug}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Settlement Currency</span>
                <span className="text-sm font-bold text-slate-900">{dashboardData.hotel.currency} ({currencySymbol})</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Default Room Tax</span>
                <span className="text-sm font-bold text-slate-900">{dashboardData.hotel.taxPercentage}%</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── NEW BOOKING MODAL ── */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowNewBookingModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create New Guest Booking</h3>
                <p className="text-xs text-slate-500">Record direct or walk-in reservation</p>
              </div>
              <button onClick={() => setShowNewBookingModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lady Vivienne Ward"
                  value={newBookingForm.guestName}
                  onChange={e => setNewBookingForm(prev => ({ ...prev, guestName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="guest@domain.com"
                    value={newBookingForm.guestEmail}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, guestEmail: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 555-0192"
                    value={newBookingForm.guestPhone}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, guestPhone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Assigned Room *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 201"
                    value={newBookingForm.roomNumber}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Room Category</label>
                  <select
                    value={newBookingForm.roomCategory}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, roomCategory: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="Standard Room">Standard Room</option>
                    <option value="Deluxe Suite">Deluxe Suite</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Presidential Penthouse">Presidential Penthouse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.checkIn}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.checkOut}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Total Bill ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBookingForm.totalAmount}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, totalAmount: e.target.value, paidAmount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-black focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Booking Source</label>
                  <select
                    value={newBookingForm.bookingSource}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, bookingSource: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="DIRECT">Direct Phone / Email</option>
                    <option value="WALK_IN">Walk-in</option>
                    <option value="WEBSITE">Brand Website</option>
                    <option value="OTA_BOOKING">OTA Booking</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Confirm & Record Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD ROOM MODAL ── */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddRoomModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Room to Inventory</h3>
                <p className="text-xs text-slate-500">Configure room number and nightly rate</p>
              </div>
              <button onClick={() => setShowAddRoomModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 501"
                  value={newRoomForm.roomNumber}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                <select
                  value={newRoomForm.category}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-600"
                >
                  <option value="Standard Room">Standard Room</option>
                  <option value="Deluxe Suite">Deluxe Suite</option>
                  <option value="Executive Suite">Executive Suite</option>
                  <option value="Presidential Penthouse">Presidential Penthouse</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price / Night ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newRoomForm.pricePerNight}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, pricePerNight: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Floor Level</label>
                  <input
                    type="number"
                    value={newRoomForm.floor}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Ocean View, King Bed, Wi-Fi"
                  value={newRoomForm.amenities}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, amenities: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Add Room to Active Roster
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD STAFF MODAL ── */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddStaffModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Staff Member</h3>
                <p className="text-xs text-slate-500">Register employee and assign operational shift</p>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gabriel Vance"
                  value={newStaffForm.name}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role / Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Head Concierge"
                  value={newStaffForm.role}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Shift</label>
                  <select
                    value={newStaffForm.shift}
                    onChange={e => setNewStaffForm(prev => ({ ...prev, shift: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="NIGHT">Night Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={newStaffForm.phone}
                    onChange={e => setNewStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Register Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
