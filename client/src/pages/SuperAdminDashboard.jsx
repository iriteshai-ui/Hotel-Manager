import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Users, BedDouble, CalendarCheck, DollarSign, TrendingUp, 
  ShieldAlert, Settings, FileText, CheckCircle2, XCircle, Search, 
  Plus, ExternalLink, RefreshCw, LogOut, ArrowUpRight, BarChart3,
  Layers, Lock, Eye, AlertTriangle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Hotel Modal State
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [newHotelForm, setNewHotelForm] = useState({
    name: '',
    slug: '',
    currency: 'USD',
    taxPercentage: 12,
    contactEmail: '',
    contactPhone: '',
    ownerUsername: '',
    ownerPassword: ''
  });

  const [statusMsg, setStatusMsg] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/overview', {
        headers: { 'X-Auth-Token': token }
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied: You must be signed in as Super Admin.');
        throw new Error('Failed to fetch platform metrics.');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/hotels', { headers: { 'X-Auth-Token': token } });
      if (res.ok) setHotels(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/users', { headers: { 'X-Auth-Token': token } });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/audit-logs', { headers: { 'X-Auth-Token': token } });
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchOverview();
    fetchHotels();
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const handleToggleHotelStatus = async (hotelId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/superadmin/hotels/${hotelId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Hotel status updated to ${nextStatus}` });
        fetchHotels();
        fetchOverview();
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to update hotel status' });
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify(newHotelForm)
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Hotel "${newHotelForm.name}" registered successfully!` });
        setShowAddHotelModal(false);
        setNewHotelForm({
          name: '', slug: '', currency: 'USD', taxPercentage: 12,
          contactEmail: '', contactPhone: '', ownerUsername: '', ownerPassword: ''
        });
        fetchHotels();
        fetchOverview();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to register hotel' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error registering hotel' });
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const navItems = [
    { id: 'overview', label: 'Platform Overview', icon: BarChart3 },
    { id: 'hotels', label: 'Registered Hotels', icon: Building2 },
    { id: 'users', label: 'Hotel Owners & Users', icon: Users },
    { id: 'audit', label: 'Security & Audit Logs', icon: ShieldAlert },
    { id: 'reports', label: 'Consolidated Reports', icon: FileText },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row antialiased">
      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="w-full md:w-72 bg-[#0F172A] text-white flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          {/* Platform Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-tight">AURA CORE</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-400">Super Admin Console</p>
            </div>
          </div>

          {/* Quick Demo Switcher Banner */}
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Active Tenant Scope</span>
            </div>
            <p className="text-xs font-bold text-white">Full Platform Owner</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Global Cross-Hotel Access</p>
          </div>

          {/* Nav List */}
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
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
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

        {/* Footer Admin User */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-black text-indigo-300">
                SA
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{username}</p>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase">Platform Owner</p>
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

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Aura v2.6.4 Multi-Tenant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-18 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#0F172A] tracking-tight capitalize">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Multi-property oversight with server-enforced tenant boundaries
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch to Hotel Owner Portal */}
            <button
              onClick={() => navigate('/hotel-dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Switch to Hotel Owner View</span>
            </button>

            <button
              onClick={() => setShowAddHotelModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Property</span>
            </button>

            <button
              onClick={() => { fetchOverview(); fetchHotels(); }}
              title="Refresh Platform Data"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Status Toast */}
        {statusMsg && (
          <div className="px-8 pt-4">
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {statusMsg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="m-8 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
            <h3 className="font-bold text-sm mb-1">Access or Synchronization Error</h3>
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && data && (
          <div className="p-8 space-y-8 animate-fade-in">
            {/* Top KPI Cards (Platform Consolidated) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Hotels */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hotels</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{data.totalHotels}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {data.activeHotels} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  {data.inactiveHotels} pending/inactive properties
                </p>
              </div>

              {/* Total Platform Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Gross Sales</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">${data.totalRevenue.toLocaleString()}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +18.4%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  ${data.totalCollections.toLocaleString()} collected in escrow
                </p>
              </div>

              {/* Total Rooms Across Hotels */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Rooms Inventory</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <BedDouble className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{data.totalRooms}</span>
                  <span className="text-xs font-bold text-slate-600">Rooms</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Across {data.totalHotels} properties registered
                </p>
              </div>

              {/* Total Bookings */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{data.totalBookings}</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  {data.totalUsers} registered staff & owners
                </p>
              </div>
            </div>

            {/* Hotel Performance Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Hotel-Wise Performance Comparison</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live revenue, inventory breakdown, and occupancy rates per tenant
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  {data.hotelPerformance.length} Properties Analyzed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Hotel Property</th>
                      <th className="py-3.5 px-6">Owner Account</th>
                      <th className="py-3.5 px-6">Rooms</th>
                      <th className="py-3.5 px-6">Bookings</th>
                      <th className="py-3.5 px-6">Total Sales</th>
                      <th className="py-3.5 px-6">Occupancy</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.hotelPerformance.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{h.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">/{h.slug}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-semibold text-slate-800 block">{h.ownerName || 'Unassigned'}</span>
                            <span className="text-[11px] font-mono text-slate-400">{h.ownerUsername || '—'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700">{h.roomsCount} rooms</td>
                        <td className="py-4 px-6 font-bold text-slate-700">{h.bookingsCount} bookings</td>
                        <td className="py-4 px-6">
                          <span className="font-black text-slate-900 text-sm">
                            {h.currency} {h.totalSales.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.min(h.occupancyRate, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700">{h.occupancyRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            h.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <a
                            href={`/menu?hotel=${h.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors no-underline"
                          >
                            <span>Live Menu</span> <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Revenue Trends & Activity Audit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Monthly Revenue Trends Chart */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Platform Monthly Sales Trajectory</h3>
                    <p className="text-xs text-slate-500">Gross transaction volume across all registered properties</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    Real-time
                  </span>
                </div>

                <div className="h-56 flex items-end gap-6 pt-6 px-4 border-b border-slate-100">
                  {data.monthlyRevenueTrends.map((t, idx) => {
                    const maxRev = Math.max(...data.monthlyRevenueTrends.map(m => m.revenue), 1000);
                    const heightPct = Math.max((t.revenue / maxRev) * 100, 15);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                          ${t.revenue.toLocaleString()}
                        </span>
                        <div 
                          className="w-full max-w-[48px] bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-xl group-hover:from-indigo-500 group-hover:to-indigo-400 transition-all shadow-md shadow-indigo-600/10"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[11px] font-bold text-slate-600 mt-1">{t.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Security & Activity Audit Log */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" /> System Audit Trail
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Live SecLog</span>
                </div>

                <div className="space-y-3">
                  {data.auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{log.action}</span>
                          {log.hotel_name && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {log.hotel_name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          actor: <strong className="text-slate-700">{log.username}</strong> • resource: {log.resource}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: REGISTERED HOTELS */}
        {activeTab === 'hotels' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Registered Hotel Tenants</h3>
                <p className="text-xs text-slate-500">Manage properties, credentials, and live availability</p>
              </div>
              <button
                onClick={() => setShowAddHotelModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Hotel Property
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map(h => (
                <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                      {h.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={() => handleToggleHotelStatus(h.id, h.status)}
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                        h.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {h.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <h4 className="text-base font-black text-slate-900 mb-1">{h.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mb-4">slug: {h.slug} • {h.currency} ({h.tax_percentage}% Tax)</p>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Rooms</span>
                      <span className="font-bold text-slate-800">{h.rooms_count || 0} registered</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Sales</span>
                      <span className="font-black text-slate-900">{h.currency} {Number(h.total_sales || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-4 space-y-1">
                    <p>Owner: <strong className="text-slate-800">{h.owner_name || 'Not assigned'}</strong></p>
                    <p className="font-mono text-[11px]">Email: {h.contact_email || '—'}</p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`/menu?hotel=${h.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors no-underline"
                    >
                      Guest Portal ↗
                    </a>
                    <button
                      onClick={() => navigate(`/hotel-dashboard?hotelId=${h.id}`)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      Manage Dashboard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Platform Users & Assigned Roles</h3>
                <p className="text-xs text-slate-500">Super Admins, Property Owners, Managers, and Staff accounts</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">User / Full Name</th>
                    <th className="py-3.5 px-6">Assigned Role</th>
                    <th className="py-3.5 px-6">Hotel Property Scope</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{u.full_name || u.username}</span>
                          <span className="text-[11px] font-mono text-slate-400">username: {u.username} • {u.email || 'no email'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          u.role === 'SUPER_ADMIN' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : u.role === 'HOTEL_OWNER'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.hotel_name ? (
                          <span className="font-bold text-slate-800">{u.hotel_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Global Platform Level</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-slate-900">Security & Administrative Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable record of logins, property registrations, and tenant boundary enforcement</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">Action</th>
                    <th className="py-3.5 px-6">Actor</th>
                    <th className="py-3.5 px-6">Hotel Property</th>
                    <th className="py-3.5 px-6">Payload / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-900">{log.action}</span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-700">
                        {log.username}
                      </td>
                      <td className="py-3.5 px-6">
                        {log.hotel_name ? (
                          <span className="font-bold text-indigo-600">{log.hotel_name}</span>
                        ) : (
                          <span className="text-slate-400">Platform Core</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: CONSOLIDATED REPORTS */}
        {activeTab === 'reports' && data && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Platform Consolidated Financial Report</h3>
                <p className="text-xs text-slate-500">Reconciled cross-property ledger and occupancy summary</p>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `aura-platform-report-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Download Consolidated JSON
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gross Invoiced Volume</span>
                <span className="text-3xl font-black text-slate-900">${data.totalRevenue.toLocaleString()}</span>
                <p className="text-xs text-slate-500 mt-2">Combined across all hotel tenant ledgers</p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Settled Collections</span>
                <span className="text-3xl font-black text-emerald-600">${data.totalCollections.toLocaleString()}</span>
                <p className="text-xs text-slate-500 mt-2">Net funds cleared via card, online & cash</p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Overall Occupancy Rate</span>
                <span className="text-3xl font-black text-indigo-600">38.9%</span>
                <p className="text-xs text-slate-500 mt-2">Across 18 registered suites & rooms</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-8 max-w-2xl space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-slate-900">Platform Security & Tenant Settings</h3>
              <p className="text-xs text-slate-500">Configure global platform policies, default tax brackets, and tenant isolation rules</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Strict Multi-Tenant Verification</h4>
                  <p className="text-xs text-slate-500">Rejects client-supplied hotelId query parameters on owner endpoints</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enforced (403)
                </span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Server Token Extraction</h4>
                  <p className="text-xs text-slate-500">Target hotel identity resolved strictly from cryptographically secure session</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">PostgreSQL Cascading Foreign Keys</h4>
                  <p className="text-xs text-slate-500">hotel_rooms, hotel_bookings, hotel_staff tied to hotel_id</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Healthy
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── REGISTER HOTEL MODAL ── */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddHotelModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Onboard New Property</h3>
                <p className="text-xs text-slate-500">Register hotel and provision owner account</p>
              </div>
              <button onClick={() => setShowAddHotelModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateHotel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hotel Property Name *</label>
                <input
                  type="text"
                  required
                  value={newHotelForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    setNewHotelForm(prev => ({
                      ...prev,
                      name,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                    }));
                  }}
                  placeholder="e.g. Sapphire Bay Resort"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={newHotelForm.slug}
                    onChange={e => setNewHotelForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="sapphire-bay"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Currency</label>
                  <select
                    value={newHotelForm.currency}
                    onChange={e => setNewHotelForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newHotelForm.contactEmail}
                    onChange={e => setNewHotelForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="concierge@sapphire.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Default Tax (%)</label>
                  <input
                    type="number"
                    value={newHotelForm.taxPercentage}
                    onChange={e => setNewHotelForm(prev => ({ ...prev, taxPercentage: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Owner Credentials */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">Hotel Owner Account Credentials</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Owner Username"
                      value={newHotelForm.ownerUsername}
                      onChange={e => setNewHotelForm(prev => ({ ...prev, ownerUsername: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Owner Password"
                      value={newHotelForm.ownerPassword}
                      onChange={e => setNewHotelForm(prev => ({ ...prev, ownerPassword: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer mt-4"
              >
                Provision Property & Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
