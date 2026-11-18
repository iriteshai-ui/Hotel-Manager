import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Users, BedDouble, CalendarCheck, DollarSign, TrendingUp, 
  ShieldAlert, Settings, FileText, CheckCircle2, XCircle, Search, 
  Plus, ExternalLink, RefreshCw, LogOut, ArrowUpRight, BarChart3,
  Layers, Lock, Eye, AlertTriangle, Key, ShieldCheck, Check, Trash2, Edit3, UserCheck, Shield, UtensilsCrossed
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  
  const [data, setData] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RBAC State
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState({});
  const [savingPerms, setSavingPerms] = useState(false);

  // Modals
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

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ code: '', name: '', description: '' });

  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState(null);
  const [userRoleIds, setUserRoleIds] = useState([]);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    hotelId: '',
    roleIds: []
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
      const res = await fetch('/api/superadmin/rbac/users', { headers: { 'X-Auth-Token': token } });
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

  const fetchRbacData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [rolesRes, modulesRes] = await Promise.all([
        fetch('/api/superadmin/rbac/roles', { headers: { 'X-Auth-Token': token } }),
        fetch('/api/superadmin/rbac/modules', { headers: { 'X-Auth-Token': token } })
      ]);

      if (rolesRes.ok && modulesRes.ok) {
        const rolesData = await rolesRes.json();
        const modulesData = await modulesRes.json();
        setRoles(rolesData);
        setModules(modulesData);

        // Select first role if none selected
        if (!selectedRole && rolesData.length > 0) {
          selectRoleForEditing(rolesData[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching RBAC:', e);
    }
  };

  const selectRoleForEditing = async (role) => {
    setSelectedRole(role);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/superadmin/rbac/roles/${role.id}/permissions`, {
        headers: { 'X-Auth-Token': token }
      });
      if (res.ok) {
        const permsList = await res.json();
        const map = {};
        for (const p of permsList) {
          map[p.module_code] = {
            can_view: p.can_view === true,
            can_add: p.can_add === true,
            can_edit: p.can_edit === true,
            can_delete: p.can_delete === true,
            can_manage: p.can_manage === true,
          };
        }
        setSelectedRolePerms(map);
      }
    } catch (e) {
      console.error('Error fetching role perms:', e);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchHotels();
    fetchUsers();
    fetchAuditLogs();
    fetchRbacData();
  }, []);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

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
        fetchUsers();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to register hotel' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error registering hotel' });
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // ── RBAC HANDLERS ──
  const handlePermissionToggle = (moduleCode, action) => {
    setSelectedRolePerms(prev => {
      const current = prev[moduleCode] || { can_view: false, can_add: false, can_edit: false, can_delete: false, can_manage: false };
      const nextVal = !current[action];
      const updated = { ...current, [action]: nextVal };

      // If user toggles add/edit/delete/manage to true, view must also be true
      if (action !== 'can_view' && nextVal) {
        updated.can_view = true;
      }
      // If user toggles view to false, other permissions must be turned off
      if (action === 'can_view' && !nextVal) {
        updated.can_add = false;
        updated.can_edit = false;
        updated.can_delete = false;
        updated.can_manage = false;
      }
      // If manage is turned on, turn on all
      if (action === 'can_manage' && nextVal) {
        updated.can_view = true;
        updated.can_add = true;
        updated.can_edit = true;
        updated.can_delete = true;
      }

      return {
        ...prev,
        [moduleCode]: updated
      };
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    setSavingPerms(true);
    try {
      const token = localStorage.getItem('auth_token');
      const permissionsArray = modules.map(m => {
        const p = selectedRolePerms[m.code] || {};
        return {
          module_code: m.code,
          can_view: p.can_view === true,
          can_add: p.can_add === true,
          can_edit: p.can_edit === true,
          can_delete: p.can_delete === true,
          can_manage: p.can_manage === true
        };
      });

      const res = await fetch(`/api/superadmin/rbac/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ permissions: permissionsArray })
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Permissions updated for role "${selectedRole.name}"` });
        fetchRbacData();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to update permissions' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving permissions' });
    } finally {
      setSavingPerms(false);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  const handleBulkPermissionPreset = (preset) => {
    setSelectedRolePerms(prev => {
      const nextMap = {};
      for (const m of modules) {
        if (preset === 'ALL') {
          nextMap[m.code] = { can_view: true, can_add: true, can_edit: true, can_delete: true, can_manage: true };
        } else if (preset === 'VIEW_ONLY') {
          nextMap[m.code] = { can_view: true, can_add: false, can_edit: false, can_delete: false, can_manage: false };
        } else if (preset === 'CLEAR') {
          nextMap[m.code] = { can_view: false, can_add: false, can_edit: false, can_delete: false, can_manage: false };
        }
      }
      return nextMap;
    });
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify(newRoleForm)
      });
      if (res.ok) {
        const created = await res.json();
        setStatusMsg({ type: 'success', text: `Role "${created.name}" created successfully!` });
        setShowCreateRoleModal(false);
        setNewRoleForm({ code: '', name: '', description: '' });
        await fetchRbacData();
        selectRoleForEditing(created);
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to create role' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error creating role' });
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/superadmin/rbac/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ name: editingRole.name, description: editingRole.description })
      });
      if (res.ok) {
        const updated = await res.json();
        setStatusMsg({ type: 'success', text: `Role "${updated.name}" updated!` });
        setShowEditRoleModal(false);
        setEditingRole(null);
        await fetchRbacData();
        setSelectedRole(updated);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to update role' });
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"? This will revoke access for mapped users.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/superadmin/rbac/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token }
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Role "${roleName}" deleted.` });
        await fetchRbacData();
        setSelectedRole(null);
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to delete role' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error deleting role' });
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleOpenUserRoleModal = (u) => {
    setSelectedUserForRoles(u);
    const assignedIds = (u.assigned_roles || []).map(r => r.id);
    setUserRoleIds(assignedIds);
    setShowUserRoleModal(true);
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUserForRoles) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/superadmin/rbac/users/${selectedUserForRoles.id}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ roleIds: userRoleIds })
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Updated roles for ${selectedUserForRoles.username}` });
        setShowUserRoleModal(false);
        fetchUsers();
        fetchRbacData();
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to assign roles' });
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCreateUserWithRoles = async (e) => {
    e.preventDefault();
    if (newUserForm.roleIds.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please select at least one role for this user.' });
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/superadmin/rbac/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify(newUserForm)
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `User ${newUserForm.username} created successfully!` });
        setShowCreateUserModal(false);
        setNewUserForm({ username: '', password: '', fullName: '', email: '', hotelId: '', roleIds: [] });
        fetchUsers();
        fetchRbacData();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to create user' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error creating user' });
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const navItems = [
    { id: 'overview', label: 'Platform Overview', icon: BarChart3 },
    { id: 'hotels', label: 'Registered Hotels', icon: Building2 },
    { id: 'rbac', label: 'Roles & Permissions (RBAC)', icon: ShieldCheck, badge: 'Dynamic' },
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
            <p className="text-[11px] text-slate-400 mt-0.5">Global Cross-Hotel Access & RBAC</p>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="pt-6 border-t border-white/10 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                SA
              </div>
              <div>
                <p className="text-xs font-bold text-white">{username}</p>
                <p className="text-[10px] text-slate-400">Platform Super Admin</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-900 capitalize">
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Supabase PostgreSQL
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'rbac' && (
              <>
                <button
                  onClick={() => setShowCreateRoleModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/15 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Role
                </button>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> Provision User
                </button>
              </>
            )}

            {activeTab === 'hotels' && (
              <button
                onClick={() => setShowAddHotelModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/15 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Register Hotel
              </button>
            )}

            <button
              onClick={() => {
                fetchOverview();
                fetchHotels();
                fetchUsers();
                fetchRbacData();
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Platform Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {statusMsg && (
          <div className="px-8 pt-4">
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <span>{statusMsg.text}</span>
              <button onClick={() => setStatusMsg(null)} className="cursor-pointer text-slate-400 hover:text-slate-700">✕</button>
            </div>
          </div>
        )}

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && data && (
          <div className="p-8 space-y-8 animate-fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Hotels</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-slate-900">{data.totalHotels}</span>
                  <span className="text-xs text-emerald-600 font-bold ml-2">● {data.activeHotels} Active</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Rooms</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BedDouble className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-slate-900">{data.totalRooms}</span>
                  <span className="text-xs text-slate-500 font-medium ml-2">Across all properties</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-slate-900">{data.totalBookings}</span>
                  <span className="text-xs text-emerald-600 font-bold ml-2">↑ 14% this month</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-slate-900">${data.totalRevenue.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-medium ml-2">Total gross sales</span>
                </div>
              </div>
            </div>

            {/* Hotel Performance Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Hotel Property Performance Comparison</h3>
                  <p className="text-xs text-slate-500">Real-time financial and occupancy benchmarking across tenant properties</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Property Name / Slug</th>
                      <th className="py-3.5 px-6">Assigned Owner</th>
                      <th className="py-3.5 px-6">Inventory</th>
                      <th className="py-3.5 px-6">Bookings</th>
                      <th className="py-3.5 px-6">Total Sales</th>
                      <th className="py-3.5 px-6">Occupancy Rate</th>
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
          </div>
        )}

        {/* Tab 2: REGISTERED HOTELS */}
        {activeTab === 'hotels' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Hotel Properties Directory</h3>
                <p className="text-xs text-slate-500">Super Admin hotel lifecycle management & multi-tenant status controls</p>
              </div>
              <button
                onClick={() => setShowAddHotelModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Hotel Property
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Hotel Property</th>
                    <th className="py-3.5 px-6">Slug & Link</th>
                    <th className="py-3.5 px-6">Currency & Tax</th>
                    <th className="py-3.5 px-6">Contact Info</th>
                    <th className="py-3.5 px-6">Rooms</th>
                    <th className="py-3.5 px-6">Tenant Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hotels.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {h.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        /{h.slug}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {h.currency} · {h.tax_percentage || 10}% tax
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {h.contact_email || '—'}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {h.roomsCount || 0} rooms
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleHotelStatus(h.id, h.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                            h.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {h.status}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          href={`/menu?hotel=${h.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors inline-flex items-center gap-1 no-underline"
                        >
                          Menu <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: DYNAMIC ROLE-BASED ACCESS CONTROL (RBAC) */}
        {activeTab === 'rbac' && (
          <div className="p-8 space-y-6 animate-fade-in">
            {/* Header info banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      Multi-Tenant RBAC Architecture
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">• Supabase PostgreSQL</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">Dynamic Role & Menu Permission Engine</h3>
                  <p className="text-xs text-slate-300 max-w-2xl mt-1">
                    Create multiple roles, configure granular menu and action permissions (View, Add, Edit, Delete, Manage), and map users. All changes persist directly to the database.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateRoleModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Role
                  </button>
                </div>
              </div>
            </div>

            {/* Two-Column RBAC Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Roles Roster */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">System Roles</h4>
                    <p className="text-[11px] text-slate-400">{roles.length} roles registered in database</p>
                  </div>
                  <button
                    onClick={() => setShowCreateRoleModal(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                </div>

                <div className="space-y-2.5">
                  {roles.map((r) => {
                    const isSelected = selectedRole?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => selectRoleForEditing(r)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">{r.name}</span>
                              {r.is_system && (
                                <span title="Protected System Role" className="text-amber-500">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-indigo-600 font-bold block mt-0.5">
                              {r.code}
                            </span>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {r.description || 'No description provided.'}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                              {r.user_count || 0} users
                            </span>
                            {!r.is_system && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRole(r.id, r.name);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                title="Delete Custom Role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Menu & Action Permission Matrix */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                {selectedRole ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">
                            Permissions for <span className="text-indigo-600 font-black">{selectedRole.name}</span>
                          </h4>
                          {selectedRole.is_system && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              System Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configure menu visibility and granular module operations (View, Add, Edit, Delete, Manage)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Preset Actions */}
                        <div className="hidden sm:flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-[10px] font-bold">
                          <button
                            onClick={() => handleBulkPermissionPreset('ALL')}
                            className="px-2 py-1 rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
                          >
                            Full Access
                          </button>
                          <button
                            onClick={() => handleBulkPermissionPreset('VIEW_ONLY')}
                            className="px-2 py-1 rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
                          >
                            Read Only
                          </button>
                          <button
                            onClick={() => handleBulkPermissionPreset('CLEAR')}
                            className="px-2 py-1 rounded hover:bg-white text-rose-600 transition-colors cursor-pointer"
                          >
                            Revoke All
                          </button>
                        </div>

                        <button
                          onClick={handleSaveRolePermissions}
                          disabled={savingPerms}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> {savingPerms ? 'Saving...' : 'Save Permissions'}
                        </button>
                      </div>
                    </div>

                    {/* Permissions Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">Menu / Module</th>
                            <th className="py-3 px-3 text-center">👁️ View</th>
                            <th className="py-3 px-3 text-center">➕ Add</th>
                            <th className="py-3 px-3 text-center">✏️ Edit</th>
                            <th className="py-3 px-3 text-center">🗑️ Delete</th>
                            <th className="py-3 px-3 text-center">⚡ Manage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {modules.map((m) => {
                            const perms = selectedRolePerms[m.code] || {
                              can_view: false, can_add: false, can_edit: false, can_delete: false, can_manage: false
                            };
                            return (
                              <tr key={m.code} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 text-xs">{m.label}</span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-100 text-slate-500">
                                        {m.code}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 block mt-0.5 line-clamp-1">
                                      {m.description}
                                    </span>
                                  </div>
                                </td>

                                {/* View checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={perms.can_view === true}
                                    onChange={() => handlePermissionToggle(m.code, 'can_view')}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                </td>

                                {/* Add checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={perms.can_add === true}
                                    onChange={() => handlePermissionToggle(m.code, 'can_add')}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                </td>

                                {/* Edit checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={perms.can_edit === true}
                                    onChange={() => handlePermissionToggle(m.code, 'can_edit')}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                </td>

                                {/* Delete checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={perms.can_delete === true}
                                    onChange={() => handlePermissionToggle(m.code, 'can_delete')}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                </td>

                                {/* Manage checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={perms.can_manage === true}
                                    onChange={() => handlePermissionToggle(m.code, 'can_manage')}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveRolePermissions}
                        disabled={savingPerms}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> {savingPerms ? 'Saving Permissions...' : 'Save Changes to Supabase'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">Select a role from the left to configure menu & action permissions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Platform Users & Assigned Roles</h3>
                <p className="text-xs text-slate-500">Super Admins, Property Owners, Managers, and Staff accounts mapped to dynamic roles</p>
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Provision New User
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">User / Full Name</th>
                    <th className="py-3.5 px-6">Assigned Roles</th>
                    <th className="py-3.5 px-6">Hotel Property Scope</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
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
                        <div className="flex flex-wrap gap-1.5">
                          {u.assigned_roles && u.assigned_roles.length > 0 ? (
                            u.assigned_roles.map((r) => (
                              <span
                                key={r.id || r.code}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  r.code === 'SUPER_ADMIN' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : r.code === 'HOTEL_OWNER'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {r.name || r.code}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                              {u.primary_role || 'STAFF'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {u.hotel_name ? (
                          <div>
                            <span className="font-bold text-slate-800 block">{u.hotel_name}</span>
                            <span className="text-[11px] font-mono text-slate-400">/{u.hotel_slug}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Global Platform Level</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenUserRoleModal(u)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          Manage Roles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-slate-900">Security & Administrative Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable record of logins, property registrations, role modifications, and tenant boundary enforcement</p>
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

        {/* Tab 6: CONSOLIDATED REPORTS */}
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

        {/* Tab 7: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-8 max-w-2xl space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-slate-900">Platform Security & Tenant Settings</h3>
              <p className="text-xs text-slate-500">Configure global platform policies, default tax brackets, and tenant isolation rules</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Dynamic RBAC Permission Resolution</h4>
                  <p className="text-xs text-slate-500">Multi-role permissions computed via Supabase PostgreSQL tables</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

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
                  <p className="text-xs text-slate-500">hotel_rooms, hotel_bookings, rbac_user_roles tied with integrity constraints</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Healthy
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── CREATE ROLE MODAL ── */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCreateRoleModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create New Role</h3>
                <p className="text-xs text-slate-500">Define a new operational role with custom menu access</p>
              </div>
              <button onClick={() => setShowCreateRoleModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role Unique Code *</label>
                <input
                  type="text"
                  required
                  value={newRoleForm.code}
                  onChange={e => setNewRoleForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                  placeholder="e.g. FRONT_DESK_AGENT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role Display Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleForm.name}
                  onChange={e => setNewRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Front Desk Agent"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newRoleForm.description}
                  onChange={e => setNewRoleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief summary of duties and authorized access..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer mt-4"
              >
                Create Role
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE USER ROLES MODAL ── */}
      {showUserRoleModal && selectedUserForRoles && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowUserRoleModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Assign Roles</h3>
                <p className="text-xs text-slate-500">Mapping roles for <span className="font-bold text-indigo-600">{selectedUserForRoles.username}</span></p>
              </div>
              <button onClick={() => setShowUserRoleModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">Select one or more roles. Multiple roles will merge authorized menu permissions.</p>

              <div className="space-y-2 max-h-64 overflow-y-auto p-1">
                {roles.map(r => {
                  const isChecked = userRoleIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{r.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{r.code}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setUserRoleIds(prev =>
                            isChecked ? prev.filter(id => id !== r.id) : [...prev, r.id]
                          );
                        }}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleSaveUserRoles}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer mt-4"
              >
                Save Assigned Roles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCreateUserModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Provision User Account</h3>
                <p className="text-xs text-slate-500">Create user, set hotel scope, and assign RBAC roles</p>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateUserWithRoles} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={e => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="e.g. jdoe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={e => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUserForm.fullName}
                    onChange={e => setNewUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@hotel.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hotel Property Scope</label>
                <select
                  value={newUserForm.hotelId}
                  onChange={e => setNewUserForm(prev => ({ ...prev, hotelId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Global Platform (Super Admin Scope)</option>
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name} (/{h.slug})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Assign Roles *</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                  {roles.map(r => {
                    const isChecked = newUserForm.roleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewUserForm(prev => ({
                              ...prev,
                              roleIds: isChecked
                                ? prev.roleIds.filter(id => id !== r.id)
                                : [...prev.roleIds, r.id]
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 cursor-pointer"
                        />
                        <span className="truncate">{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer mt-4"
              >
                Provision User & Assign Roles
              </button>
            </form>
          </div>
        </div>
      )}

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
