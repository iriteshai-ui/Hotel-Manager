import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../SocketContext';
import BillModal from '../components/BillModal';
import { 
  Building2, Users, BedDouble, CalendarCheck, DollarSign, TrendingUp, 
  Settings, FileText, CheckCircle2, XCircle, Search, Plus, ExternalLink, 
  RefreshCw, LogOut, ArrowUpRight, BarChart3, CreditCard, Shield, 
  Clock, Download, Filter, UserCheck, AlertCircle, Wrench, Sparkles, ChevronRight,
  UtensilsCrossed, ChefHat, Receipt, Trash2, Printer, Check, Edit3,
  Calendar, CalendarDays, ChevronLeft, UserX, X,
  LayoutDashboard, Package, ArrowDownRight, Layers
} from 'lucide-react';

export default function HotelOwnerDashboard() {
  const { logout, username, role, roles, hotelName: authHotelName, hotelCurrency: authCurrency, hotelId: authHotelId, hotelSlug: authHotelSlug, login, hasPermission, canAccessModule, isSuperAdmin } = useAuth();
  const { tables, orders, isConnected, addTable, deleteTable, freeTable, updateOrderStatus } = useSocket();
  const [searchParams] = useSearchParams();
  const hotelIdQuery = searchParams.get('hotelId');
  const navigate = useNavigate();

  // Primary Restaurant Landing Tab
  const [activeTab, setActiveTab] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('tab');
    if (!param) return 'dining-dashboard';
    if (param === 'overview') return 'dining-dashboard';
    if (param === 'dining-tables') return 'table-management';
    if (param === 'live-orders') return 'order-management';
    if (param === 'dining-menu') return 'menu-management';
    if (param === 'financials') return 'sales-billing';
    if (param === 'staff') return 'staff-attendance';
    if (param === 'bookings' || param === 'rooms' || param === 'customers') return 'hotel-rooms';
    return param;
  });
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

  // Restaurant First: Dining Dashboard, Expenses, Inventory, P&L
  const [diningDashboardData, setDiningDashboardData] = useState(null);
  const [diningLoading, setDiningLoading] = useState(false);
  const [salesReportPeriod, setSalesReportPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [diningSubTab, setDiningSubTab] = useState(() => {
    const sub = new URLSearchParams(window.location.search).get('subtab');
    if (sub && ['live-orders', 'table-occupancy', 'overview', 'sales-trends', 'stock-alerts'].includes(sub)) {
      return sub;
    }
    return 'live-orders';
  });
  const [tableFloorFilter, setTableFloorFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'

  // Orders Management Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderMgmtStatusFilter, setOrderMgmtStatusFilter] = useState('ALL');
  const [orderTableFilter, setOrderTableFilter] = useState('ALL');
  const [orderDateFilter, setOrderDateFilter] = useState('ALL');

  // Expenses State
  const [expensesList, setExpensesList] = useState([]);
  const [totalExpensesAmount, setTotalExpensesAmount] = useState(0);
  const [expenseCategories, setExpenseCategories] = useState({});
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    title: '',
    category: 'Meat & Poultry',
    amount: '',
    paymentMethod: 'UPI',
    notes: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });

  // Inventory State
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({ totalItems: 0, lowStockCount: 0, totalValuation: 0 });
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInventoryForm, setNewInventoryForm] = useState({
    itemName: '',
    category: 'Grains & Rice',
    quantity: '',
    unit: 'kg',
    minThreshold: 5,
    costPerUnit: ''
  });
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTargetItem, setRestockTargetItem] = useState(null);
  const [restockAddQuantity, setRestockAddQuantity] = useState('');

  // Profit & Loss State
  const [plPeriod, setPlPeriod] = useState('monthly');
  const [plReportData, setPlReportData] = useState(null);

  // Hotel Room Management Sub-tab
  const [roomSubTab, setRoomSubTab] = useState('inventory'); // 'inventory', 'reservations', 'guests'

  // Restaurant & Dining Management State
  const [hotelTables, setHotelTables] = useState([]);
  const [hotelMenuItems, setHotelMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Restaurant Modals & Orders State
  const [hotelOrders, setHotelOrders] = useState([]);
  const [billingOrder, setBillingOrder] = useState(null);
  const [billingTableNumber, setBillingTableNumber] = useState(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishForm, setNewDishForm] = useState({
    name: '',
    category: 'Veg Starter',
    price: '',
    description: '',
    isBestseller: false,
    isVeg: true
  });

  // Table Order Placement & Item Management State
  const [showTableOrderModal, setShowTableOrderModal] = useState(false);
  const [orderingTableNumber, setOrderingTableNumber] = useState(null);
  const [activeExistingOrderId, setActiveExistingOrderId] = useState(null);
  const [orderCart, setOrderCart] = useState([]);
  const [orderItemSearch, setOrderItemSearch] = useState('');
  const [orderItemCategory, setOrderItemCategory] = useState('ALL');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Hotel Property Settings State
  const [showEditHotelModal, setShowEditHotelModal] = useState(false);
  const [editHotelForm, setEditHotelForm] = useState({
    name: '',
    currency: 'INR',
    taxPercentage: 10,
    contactEmail: '',
    contactPhone: '',
    status: 'ACTIVE'
  });
  const [savingHotel, setSavingHotel] = useState(false);

  // Staff Attendance Management State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    unmarked: 0
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [staffSubTab, setStaffSubTab] = useState('attendance'); // 'attendance' or 'directory'
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffShiftFilter, setStaffShiftFilter] = useState('ALL');

  // Monthly Attendance History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [historyMonth, setHistoryMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthlyHistoryData, setMonthlyHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    totalAmount: '', paidAmount: '', paymentStatus: 'PAID', bookingSource: 'DIRECT', paymentMethod: 'CARD'
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
    const effectiveHotelId = isSuperAdmin ? (hotelIdQuery || authHotelId) : (authHotelId || localStorage.getItem('auth_hotel_id'));
    if (effectiveHotelId) headers['x-hotel-id'] = effectiveHotelId;
    return headers;
  };

  const getQueryUrl = (base) => {
    if (isSuperAdmin && hotelIdQuery) {
      return `${base}?hotelId=${hotelIdQuery}`;
    }
    return base;
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

  // 7b. Fetch Daily Staff Attendance
  const fetchStaffAttendance = async (date) => {
    const targetDate = date || attendanceDate;
    setAttendanceLoading(true);
    try {
      const res = await fetch(getQueryUrl(`/api/hotel-owner/staff/attendance?date=${targetDate}`), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setStaffAttendance(data.records || []);
        if (data.summary) {
          setAttendanceSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching staff attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // 8. Fetch Restaurant Menu for current hotel tenant
  const fetchHotelMenu = async (slug) => {
    if (!slug) return;
    setMenuLoading(true);
    try {
      const res = await fetch(`/api/hotels/${encodeURIComponent(slug)}/menu`);
      if (res.ok) {
        const data = await res.json();
        setHotelMenuItems(data.items || []);
      }
    } catch (err) {
      console.error('Error loading restaurant menu:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  // 9. Fetch Dining Tables for current hotel tenant
  const fetchHotelTables = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/tables'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHotelTables(data);
      }
    } catch (e) {
      console.error('Error loading hotel tables:', e);
    }
  };

  // 10. Fetch Dining & Kitchen Orders for current hotel tenant
  const fetchHotelOrders = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/orders'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHotelOrders(data);
      }
    } catch (e) {
      console.error('Error loading hotel orders:', e);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics();
    fetchBookings();
    fetchRooms();
    fetchCustomers();
    fetchFinancials();
    fetchStaff();
    fetchStaffAttendance(attendanceDate);
    fetchHotelTables();
    fetchHotelOrders();
  }, [hotelIdQuery]);

  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaffAttendance(attendanceDate);
      fetchStaff();
    }
  }, [activeTab, attendanceDate]);

  useEffect(() => {
    if (dashboardData?.hotel?.slug) {
      fetchHotelMenu(dashboardData.hotel.slug);
    }
  }, [dashboardData?.hotel?.slug]);

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

  // Restaurant & Dining Actions
  const handleToggleBestseller = async (itemId) => {
    if (!dashboardData?.hotel?.slug) return;
    try {
      const res = await fetch(`/api/hotels/${dashboardData.hotel.slug}/menu/${itemId}/bestseller`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setHotelMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isBestseller: updated.isBestseller } : i));
        showToast(updated.isBestseller ? '⭐ Pinned to Top as Bestseller!' : 'Unpinned from Bestsellers');
      }
    } catch {
      showToast('Failed to update bestseller status', 'error');
    }
  };

  const handleToggleAvailability = async (item) => {
    if (!dashboardData?.hotel?.slug) return;
    try {
      const nextStatus = item.isAvailable === false;
      const res = await fetch(`/api/hotels/${dashboardData.hotel.slug}/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isAvailable: nextStatus })
      });
      if (res.ok) {
        setHotelMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: nextStatus } : i));
        showToast(nextStatus ? `"${item.name}" marked Available` : `"${item.name}" marked Sold Out`);
      }
    } catch {
      showToast('Failed to toggle availability', 'error');
    }
  };

  const handleDeleteMenuItem = async (itemId, itemName) => {
    if (!dashboardData?.hotel?.slug) return;
    if (!window.confirm(`Delete "${itemName}" from restaurant menu?`)) return;
    try {
      const res = await fetch(`/api/hotels/${dashboardData.hotel.slug}/menu/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setHotelMenuItems(prev => prev.filter(i => i.id !== itemId));
        showToast(`"${itemName}" deleted from menu`);
      }
    } catch {
      showToast('Failed to delete dish', 'error');
    }
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    if (!dashboardData?.hotel?.slug) return;
    try {
      const res = await fetch(`/api/hotels/${dashboardData.hotel.slug}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: newDishForm.name,
          category: newDishForm.category,
          price: parseFloat(newDishForm.price),
          description: newDishForm.description,
          isBestseller: newDishForm.isBestseller,
          isAvailable: true,
          dietaryTags: newDishForm.isVeg ? ['VEG'] : ['NON_VEG']
        })
      });
      if (res.ok) {
        const created = await res.json();
        setHotelMenuItems(prev => [created, ...prev]);
        setShowAddDishModal(false);
        setNewDishForm({ name: '', category: 'Veg Starter', price: '', description: '', isBestseller: false, isVeg: true });
        showToast(`"${created.name}" added to restaurant menu!`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add dish', 'error');
      }
    } catch {
      showToast('Network error adding dish', 'error');
    }
  };

  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(newTableNum, 10);
    const cap = parseInt(newTableCapacity, 10) || 4;
    if (!num) return;
    try {
      const res = await fetch(getQueryUrl('/api/tables'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ number: num, capacity: cap, hotelId: dashboardData?.hotel?.id })
      });
      if (res.ok) {
        showToast(`Table ${num} added to dining floor!`);
        setShowAddTableModal(false);
        setNewTableNum('');
        fetchHotelTables();
        if (addTable) addTable(num, cap);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || `Table ${num} could not be added (may already exist)`, 'error');
      }
    } catch {
      showToast('Error adding table', 'error');
    }
  };

  const handleFreeTableAction = async (tableNum) => {
    try {
      const res = await fetch(getQueryUrl(`/api/tables/${tableNum}/free`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast(`Table ${tableNum} is now Available`);
        fetchHotelTables();
      } else {
        showToast(`Failed to free Table ${tableNum}`, 'error');
      }
    } catch {
      showToast('Error freeing table', 'error');
    }
  };

  const handleUpdateTableStatusAction = async (tableNum, status) => {
    try {
      const res = await fetch(`/api/tables/${tableNum}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Table ${tableNum} status updated to ${status}`);
        fetchHotelTables();
      } else {
        showToast(`Failed to update Table ${tableNum} status`, 'error');
      }
    } catch {
      showToast('Error updating table status', 'error');
    }
  };

  const handleDeleteTableAction = async (tableNum) => {
    if (!window.confirm(`Remove Table ${tableNum} from floor plan?`)) return;
    try {
      const res = await fetch(getQueryUrl(`/api/tables/${tableNum}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast(`Table ${tableNum} removed from dining floor`);
        fetchHotelTables();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete table', 'error');
      }
    } catch {
      showToast('Error deleting table', 'error');
    }
  };

  const handleSettleOrder = (order, tableNum) => {
    setBillingOrder(order);
    setBillingTableNumber(tableNum);
  };

  const handleOpenNewOrder = (tableNum = null) => {
    const slug = dashboardData?.hotel?.slug || authHotelSlug;
    if (slug && hotelMenuItems.length === 0) fetchHotelMenu(slug);
    const targetNum = tableNum || (displayedTables.find(t => t.status === 'AVAILABLE')?.number || displayedTables[0]?.number || 1);
    setOrderingTableNumber(targetNum);
    setActiveExistingOrderId(null);
    setOrderCart([]);
    setOrderItemSearch('');
    setOrderItemCategory('ALL');
    setShowTableOrderModal(true);
  };

  const handleOpenAddItems = (order, tableNum) => {
    const slug = dashboardData?.hotel?.slug || authHotelSlug;
    if (slug && hotelMenuItems.length === 0) fetchHotelMenu(slug);
    setOrderingTableNumber(tableNum);
    setActiveExistingOrderId(order.id);
    setOrderCart([]);
    setOrderItemSearch('');
    setOrderItemCategory('ALL');
    setShowTableOrderModal(true);
  };

  const handleOrderCartAdd = (item) => {
    setOrderCart(prev => {
      const existing = prev.find(i => (i.menuItemId || i.id) === (item.id || item.menuItemId));
      if (existing) {
        return prev.map(i => (i.menuItemId || i.id) === (item.id || item.menuItemId) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        quantity: 1,
        category: item.category || 'Mains'
      }];
    });
  };

  const handleOrderCartRemove = (itemId) => {
    setOrderCart(prev => prev.reduce((acc, i) => {
      if ((i.menuItemId || i.id) === itemId) {
        if (i.quantity > 1) acc.push({ ...i, quantity: i.quantity - 1 });
      } else {
        acc.push(i);
      }
      return acc;
    }, []));
  };

  const handleOrderCartDelete = (itemId) => {
    setOrderCart(prev => prev.filter(i => (i.menuItemId || i.id) !== itemId));
  };

  const handleUpdateOrderStatusAction = async (orderId, newStatus) => {
    try {
      if (updateOrderStatus) updateOrderStatus(orderId, newStatus);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setHotelOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        showToast(`Order status updated to ${newStatus}`);
        fetchHotelOrders();
        fetchHotelTables();
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch {
      showToast('Error updating order status', 'error');
    }
  };

  const handleSubmitTableOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!orderingTableNumber) {
      showToast('Please select a table number', 'error');
      return;
    }
    if (orderCart.length === 0) {
      showToast('Please select at least one dish for the order', 'error');
      return;
    }

    setOrderSubmitting(true);
    try {
      if (activeExistingOrderId) {
        const res = await fetch(`/api/orders/${activeExistingOrderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ items: orderCart })
        });
        if (res.ok) {
          const updated = await res.json();
          setHotelOrders(prev => prev.map(o => o.id === activeExistingOrderId ? updated : o));
          showToast(`Added ${orderCart.length} dish(es) to Table ${orderingTableNumber} order!`);
          setShowTableOrderModal(false);
          setOrderCart([]);
          fetchHotelOrders();
          fetchHotelTables();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || 'Failed to add items to order', 'error');
        }
      } else {
        const effHotel = effectiveHotelId || dashboardData?.hotel?.id;
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            tableNumber: orderingTableNumber,
            items: orderCart,
            hotelId: effHotel
          })
        });
        if (res.ok) {
          const created = await res.json();
          setHotelOrders(prev => [created, ...prev]);
          showToast(`Order created for Table ${orderingTableNumber} and sent to Kitchen!`);
          setShowTableOrderModal(false);
          setOrderCart([]);
          fetchHotelOrders();
          fetchHotelTables();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || 'Failed to create table order', 'error');
        }
      }
    } catch {
      showToast('Network error while placing order', 'error');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleOpenEditHotelModal = () => {
    if (!dashboardData?.hotel) return;
    setEditHotelForm({
      name: dashboardData.hotel.name || '',
      currency: dashboardData.hotel.currency || 'INR',
      taxPercentage: dashboardData.hotel.taxPercentage ?? 10,
      contactEmail: dashboardData.hotel.contactEmail || '',
      contactPhone: dashboardData.hotel.contactPhone || '',
      status: dashboardData.hotel.status || 'ACTIVE'
    });
    setShowEditHotelModal(true);
  };

  const handleSaveHotelSettings = async (e) => {
    e?.preventDefault();
    if (!editHotelForm.name.trim()) {
      showToast('Hotel name cannot be empty', 'error');
      return;
    }
    setSavingHotel(true);
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/hotel'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editHotelForm)
      });
      if (res.ok) {
        const data = await res.json();
        const updatedHotel = data.hotel || data;
        setDashboardData(prev => prev ? {
          ...prev,
          hotel: {
            ...prev.hotel,
            name: updatedHotel.name || editHotelForm.name,
            currency: updatedHotel.currency || editHotelForm.currency,
            taxPercentage: updatedHotel.tax_percentage ?? updatedHotel.taxPercentage ?? editHotelForm.taxPercentage,
            contactEmail: updatedHotel.contact_email ?? updatedHotel.contactEmail ?? editHotelForm.contactEmail,
            contactPhone: updatedHotel.contact_phone ?? updatedHotel.contactPhone ?? editHotelForm.contactPhone,
            status: updatedHotel.status || editHotelForm.status
          }
        } : null);
        setShowEditHotelModal(false);
        showToast('Hotel properties updated successfully!');
        fetchDashboardData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update hotel properties', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating hotel properties', 'error');
    } finally {
      setSavingHotel(false);
    }
  };

  const handleToggleHotelPropertyStatus = async () => {
    if (!dashboardData?.hotel) return;
    const currentStatus = dashboardData.hotel.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/hotel/status'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setDashboardData(prev => prev ? {
          ...prev,
          hotel: {
            ...prev.hotel,
            status: newStatus
          }
        } : null);
        showToast(`Hotel is now ${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'}!`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating status', 'error');
    }
  };

  // ── DAILY STAFF ATTENDANCE ACTIONS ──
  const handleMarkAttendance = async (staffMember, status, notes = '') => {
    const staffId = staffMember.staff_id || staffMember.id;
    // Optimistic UI update for instantaneous responsiveness
    setStaffAttendance(prev => {
      const updated = prev.map(item => {
        if ((item.staff_id || item.id) === staffId) {
          return {
            ...item,
            attendance_status: status,
            notes: notes !== undefined ? notes : (item.notes || '')
          };
        }
        return item;
      });

      setAttendanceSummary({
        totalStaff: updated.length,
        present: updated.filter(r => r.attendance_status === 'PRESENT').length,
        absent: updated.filter(r => r.attendance_status === 'ABSENT').length,
        halfDay: updated.filter(r => r.attendance_status === 'HALF_DAY').length,
        leave: updated.filter(r => r.attendance_status === 'LEAVE').length,
        unmarked: updated.filter(r => r.attendance_status === 'UNMARKED').length
      });

      return updated;
    });

    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/staff/attendance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          staffId,
          date: attendanceDate,
          status,
          notes
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setAttendanceSummary(data.summary);
        }
        const label = status === 'PRESENT' ? 'Present' :
                      status === 'ABSENT' ? 'Absent' :
                      status === 'HALF_DAY' ? 'Half Day' : 'On Leave';
        showToast(`Marked ${staffMember.name} as ${label}`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to record attendance', 'error');
        fetchStaffAttendance(attendanceDate);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while marking attendance', 'error');
      fetchStaffAttendance(attendanceDate);
    }
  };

  const handleBatchMarkAllPresent = async () => {
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/staff/attendance/batch'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          date: attendanceDate,
          status: 'PRESENT'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStaffAttendance(data.records || []);
        if (data.summary) setAttendanceSummary(data.summary);
        showToast(`All active staff marked Present for ${attendanceDate}!`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to mark all present', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error on batch attendance', 'error');
    }
  };

  const handleShiftAttendanceDay = (delta) => {
    const cur = new Date(attendanceDate);
    cur.setDate(cur.getDate() + delta);
    setAttendanceDate(cur.toISOString().split('T')[0]);
  };

  const handleSetAttendanceToday = () => {
    setAttendanceDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenMonthlyHistory = (staffMember) => {
    const member = {
      id: staffMember.staff_id || staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      shift: staffMember.shift,
      email: staffMember.email,
      phone: staffMember.phone
    };
    setHistoryStaff(member);
    const initialMonth = attendanceDate.slice(0, 7);
    setHistoryMonth(initialMonth);
    setShowHistoryModal(true);
    fetchMonthlyHistory(member.id, initialMonth);
  };

  const fetchMonthlyHistory = async (staffId, month) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(getQueryUrl(`/api/hotel-owner/staff/${staffId}/attendance-history?month=${month}`), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyHistoryData(data);
      } else {
        setMonthlyHistoryData(null);
      }
    } catch (err) {
      console.error('Error fetching monthly history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShiftHistoryMonth = (deltaMonths) => {
    const [y, m] = historyMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + deltaMonths, 1);
    const nextMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setHistoryMonth(nextMonth);
    if (historyStaff?.id) {
      fetchMonthlyHistory(historyStaff.id, nextMonth);
    }
  };

  const handleUpdateHistoricalAttendance = async (date, status) => {
    if (!historyStaff?.id) return;
    try {
      const res = await fetch(getQueryUrl('/api/hotel-owner/staff/attendance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          staffId: historyStaff.id,
          date,
          status
        })
      });
      if (res.ok) {
        showToast(`Attendance updated for ${date}`);
        fetchMonthlyHistory(historyStaff.id, historyMonth);
        if (date === attendanceDate) {
          fetchStaffAttendance(attendanceDate);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update historical attendance', 'error');
    }
  };

  const filteredStaffAttendance = useMemo(() => {
    const q = (staffSearchQuery || '').toLowerCase().trim();
    return staffAttendance.filter(item => {
      const matchShift = staffShiftFilter === 'ALL' || (item.shift || '').toUpperCase() === staffShiftFilter;
      const matchSearch = !q || 
        (item.name || '').toLowerCase().includes(q) || 
        (item.role || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.phone || '').toLowerCase().includes(q);
      return matchShift && matchSearch;
    });
  }, [staffAttendance, staffShiftFilter, staffSearchQuery]);

  const currencySymbol = dashboardData?.hotel?.currency === 'EUR' ? '€' : 
                         dashboardData?.hotel?.currency === 'INR' ? '₹' : 
                         dashboardData?.hotel?.currency === 'GBP' ? '£' : '$';

  const effectiveHotelId = isSuperAdmin ? (hotelIdQuery || authHotelId) : (authHotelId || localStorage.getItem('auth_hotel_id'));
  const displayedTables = hotelTables.length > 0 ? hotelTables : tables;
  const displayedOrders = useMemo(() => {
    const map = new Map();
    (hotelOrders || []).forEach(o => map.set(o.id, o));
    (orders || []).forEach(o => {
      if (effectiveHotelId && o.hotelId && o.hotelId !== effectiveHotelId) return;
      if (map.has(o.id)) {
        map.set(o.id, { ...map.get(o.id), ...o });
      } else {
        map.set(o.id, o);
      }
    });
    return Array.from(map.values());
  }, [hotelOrders, orders, effectiveHotelId]);

  const orderModalCategories = useMemo(() => {
    return ['ALL', ...new Set((hotelMenuItems || []).map(i => i.category).filter(Boolean))];
  }, [hotelMenuItems]);

  const filteredOrderDishes = useMemo(() => {
    const q = (orderItemSearch || '').toLowerCase().trim();
    return (hotelMenuItems || []).filter(item => {
      const matchCat = orderItemCategory === 'ALL' || item.category === orderItemCategory;
      const matchSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [hotelMenuItems, orderItemCategory, orderItemSearch]);

  const orderCartSubtotal = useMemo(() => {
    return orderCart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)), 0);
  }, [orderCart]);

  const orderTaxRate = parseFloat(dashboardData?.hotel?.taxPercentage || 10);
  const orderCartTax = (orderCartSubtotal * orderTaxRate) / 100;
  const orderCartTotal = orderCartSubtotal + orderCartTax;
  const occupiedRoomsCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const occupiedTablesCount = displayedTables.filter(t => t.status === 'OCCUPIED').length;
  const availableTablesCount = displayedTables.filter(t => t.status === 'AVAILABLE' || (!t.status && t.status !== 'OCCUPIED' && t.status !== 'RESERVED')).length;
  const reservedTablesCount = displayedTables.filter(t => t.status === 'RESERVED').length;

  const activeOrdersCount = displayedOrders.filter(o => o.status !== 'PAID' && o.status !== 'COMPLETED').length;
  const placedOrdersCount = displayedOrders.filter(o => o.status === 'PLACED').length;
  const preparingOrdersCount = displayedOrders.filter(o => o.status === 'PREPARING').length;
  const servedOrdersCount = displayedOrders.filter(o => o.status === 'SERVED').length;
  const completedOrdersCount = displayedOrders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED').length;

  const filteredManagementOrders = useMemo(() => {
    return displayedOrders.filter(order => {
      // Search query
      if (orderSearchQuery) {
        const q = orderSearchQuery.toLowerCase();
        const matchesId = (order.id || '').toLowerCase().includes(q);
        const matchesTable = String(order.tableNumber || order.table_number || '').includes(q);
        const matchesItems = (order.items || []).some(item => (item.name || item.item_name || '').toLowerCase().includes(q));
        if (!matchesId && !matchesTable && !matchesItems) return false;
      }
      // Status filter
      if (orderMgmtStatusFilter !== 'ALL') {
        if (orderMgmtStatusFilter === 'ACTIVE') {
          if (order.status === 'PAID' || order.status === 'COMPLETED') return false;
        } else if (order.status !== orderMgmtStatusFilter) {
          return false;
        }
      }
      // Table filter
      if (orderTableFilter !== 'ALL') {
        if (String(order.tableNumber || order.table_number) !== String(orderTableFilter)) return false;
      }
      // Date filter
      if (orderDateFilter === 'TODAY') {
        const todayStr = new Date().toISOString().split('T')[0];
        const ordDate = (order.created_at || order.createdAt || '').slice(0, 10);
        if (ordDate && ordDate !== todayStr) return false;
      } else if (orderDateFilter === 'YESTERDAY') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yestStr = d.toISOString().split('T')[0];
        const ordDate = (order.created_at || order.createdAt || '').slice(0, 10);
        if (ordDate && ordDate !== yestStr) return false;
      }
      return true;
    });
  }, [displayedOrders, orderSearchQuery, orderMgmtStatusFilter, orderTableFilter, orderDateFilter]);

  const filteredFloorTables = useMemo(() => {
    if (tableFloorFilter === 'ALL') return displayedTables;
    if (tableFloorFilter === 'OCCUPIED') return displayedTables.filter(t => t.status === 'OCCUPIED');
    if (tableFloorFilter === 'RESERVED') return displayedTables.filter(t => t.status === 'RESERVED');
    if (tableFloorFilter === 'AVAILABLE') return displayedTables.filter(t => t.status === 'AVAILABLE' || (!t.status && t.status !== 'OCCUPIED' && t.status !== 'RESERVED'));
    return displayedTables;
  }, [displayedTables, tableFloorFilter]);

  const navSections = [
    {
      heading: 'Restaurant Operations',
      items: [
        { id: 'dining-dashboard', label: '1. Dining Dashboard', icon: LayoutDashboard, module: 'DASHBOARD' },
        { id: 'order-management', label: '2. Order Management', icon: ChefHat, module: 'DINING_MENU' },
        { id: 'table-management', label: '3. Table Management', icon: UtensilsCrossed, module: 'DINING_MENU' },
        { id: 'menu-management', label: '4. Menu Management', icon: Sparkles, module: 'DINING_MENU' },
        { id: 'sales-billing', label: '5. Sales & Billing', icon: Receipt, module: 'FINANCIALS' },
      ]
    },
    {
      heading: 'Accounts & Operations',
      items: [
        { id: 'expenses', label: '6. Expenses', icon: CreditCard, module: 'FINANCIALS' },
        { id: 'profit-loss', label: '7. Profit & Loss Reports', icon: BarChart3, module: 'FINANCIALS' },
        { id: 'staff-attendance', label: '8. Staff & Attendance', icon: UserCheck, module: 'STAFF' },
        { id: 'inventory-management', label: '9. Kitchen Inventory', icon: Package, module: 'ROOMS' },
      ]
    },
    {
      heading: 'Secondary / Lodging',
      items: [
        { id: 'hotel-rooms', label: '10. Hotel Room Management', icon: BedDouble, module: 'BOOKINGS' },
      ]
    }
  ];

  // Dynamically filter sidebar modules based on backend Supabase RBAC permissions
  const filteredNavSections = navSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => isSuperAdmin || canAccessModule(item.module))
  })).filter(sec => sec.items.length > 0);

  const flatNavItems = filteredNavSections.flatMap(sec => sec.items);

  useEffect(() => {
    if (flatNavItems.length > 0 && !flatNavItems.some(i => i.id === activeTab)) {
      const isOverview = activeTab === 'overview' && flatNavItems.some(i => i.id === 'dining-dashboard');
      const isLiveOrders = activeTab === 'live-orders' && flatNavItems.some(i => i.id === 'order-management');
      const isDiningTables = activeTab === 'dining-tables' && flatNavItems.some(i => i.id === 'table-management');
      const isDiningMenu = activeTab === 'dining-menu' && flatNavItems.some(i => i.id === 'menu-management');
      const isFinancials = activeTab === 'financials' && flatNavItems.some(i => i.id === 'sales-billing');
      const isStaff = activeTab === 'staff' && flatNavItems.some(i => i.id === 'staff-attendance');
      const isHotelRooms = (activeTab === 'bookings' || activeTab === 'rooms' || activeTab === 'customers') && flatNavItems.some(i => i.id === 'hotel-rooms');
      if (!isOverview && !isLiveOrders && !isDiningTables && !isDiningMenu && !isFinancials && !isStaff && !isHotelRooms) {
        setActiveTab(flatNavItems[0].id);
      }
    }
  }, [flatNavItems, activeTab]);

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
          <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">Tenant Data Isolation</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Strictly restricted to <strong>{dashboardData?.hotel?.name || 'Assigned Hotel'}</strong> records.
            </p>
          </div>

          {/* Grouped Navigation Sections */}
          <nav className="space-y-4">
            {filteredNavSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400/80">
                  {section.heading}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id ||
                    (item.id === 'dining-dashboard' && activeTab === 'overview') ||
                    (item.id === 'order-management' && activeTab === 'live-orders') ||
                    (item.id === 'table-management' && activeTab === 'dining-tables') ||
                    (item.id === 'menu-management' && activeTab === 'dining-menu') ||
                    (item.id === 'sales-billing' && activeTab === 'financials') ||
                    (item.id === 'staff-attendance' && activeTab === 'staff') ||
                    (item.id === 'hotel-rooms' && (activeTab === 'bookings' || activeTab === 'rooms' || activeTab === 'customers'));

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              </div>
            ))}
          </nav>
        </div>

        {/* Footer User Info */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xs font-black text-amber-300">
                RO
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{username}</p>
                <p className="text-[10px] text-slate-400 font-medium">Restaurant Owner / Admin</p>
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
        <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex flex-col gap-3 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
                  {dashboardData?.hotel?.name || 'Restaurant Management Dashboard'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase font-mono">
                  {dashboardData?.hotel?.currency || 'INR'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase font-mono">
                  Restaurant OS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Restaurant operations: Dining floor, kitchen orders, billing, expenses & menu management
              </p>
            </div>

            {/* Isolated Tenant Identity */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 self-start lg:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{dashboardData?.hotel?.name || authHotelName || 'Restaurant Property'}</span>
              <span className="text-[10px] text-slate-400 font-mono">({currencySymbol})</span>
            </div>
          </div>

          {/* Operational Status Badges & Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Live Restaurant Badges - Strictly Restaurant */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                <span>Restaurant: {tables.length} Tables ({occupiedTablesCount} Active)</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                <span>Active Orders: {displayedOrders.filter(o => o.status !== 'PAID').length} In Kitchen</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono font-medium">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isConnected ? 'Live WebSocket' : 'Syncing'}</span>
              </div>
            </div>

            {/* Quick Navigation Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              {dashboardData?.hotel?.slug && (
                <a
                  href={`/menu?hotel=${dashboardData.hotel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 no-underline"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Customer Menu ↗</span>
                </a>
              )}

              <a
                href="/kitchen"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 no-underline"
              >
                <ChefHat className="w-3.5 h-3.5 text-rose-600" />
                <span>Kitchen KDS ↗</span>
              </a>

              <a
                href="/waiter"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 no-underline"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
                <span>Waiter POS ↗</span>
              </a>

              <button
                onClick={() => handleOpenNewOrder()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Take Table Order</span>
              </button>
            </div>
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
              onClick={() => { logout(); navigate('/login'); }}
              className="px-4 py-2.5 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        
        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 1: DINING DASHBOARD (Landing View - Restaurant First)   */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'dining-dashboard' || activeTab === 'overview') && (
          <div className="p-6 sm:p-8 space-y-8 animate-fade-in">
            {/* Header & Quick Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dining Floor Operations</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Restaurant POS Mode
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Real-time restaurant sales, floor turnover, raw material expenses, and net profit ledger
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { fetchDiningDashboard(); fetchHotelOrders(); fetchHotelTables(); }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${diningLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => handleOpenNewOrder()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Take New Order</span>
                </button>
              </div>
            </div>

            {/* ── 7 CORE DINING METRICS REQUIRED (CLICKABLE QUICK-JUMP) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
              {/* 1. Today's Total Sales */}
              <div 
                onClick={() => setDiningSubTab('sales-trends')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
                title="Click to view full Sales & Trends analysis"
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-amber-700 transition-colors">1. Today's Sales</span>
                <div>
                  <span className="text-xl lg:text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {currencySymbol}{(diningDashboardData?.metrics?.todaySales || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> Live register
                  </span>
                </div>
              </div>

              {/* 2. Total Orders */}
              <div 
                onClick={() => { setDiningSubTab('live-orders'); setOrderMgmtStatusFilter('ALL'); }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
                title="Click to view all orders in Live Orders queue"
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-amber-700 transition-colors">2. Total Orders</span>
                <div>
                  <span className="text-xl lg:text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {diningDashboardData?.metrics?.totalOrders || displayedOrders.length}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                    Today & active queue
                  </span>
                </div>
              </div>

              {/* 3. Active / Pending Orders */}
              <div 
                onClick={() => { setDiningSubTab('live-orders'); setOrderMgmtStatusFilter('ACTIVE'); }}
                className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
                title="Click to filter active kitchen orders"
              >
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">3. Active / Pending</span>
                <div>
                  <span className="text-xl lg:text-2xl font-black text-amber-700 group-hover:text-amber-800 transition-colors">
                    {diningDashboardData?.metrics?.activeOrders ?? activeOrdersCount}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-0.5" /> Kitchen cooking
                  </span>
                </div>
              </div>

              {/* 4. Completed Orders */}
              <div 
                onClick={() => { setDiningSubTab('live-orders'); setOrderMgmtStatusFilter('PAID'); }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
                title="Click to filter completed orders"
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-emerald-700 transition-colors">4. Completed</span>
                <div>
                  <span className="text-xl lg:text-2xl font-black text-emerald-700">
                    {diningDashboardData?.metrics?.completedOrders ?? completedOrdersCount}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> Served & settled
                  </span>
                </div>
              </div>

              {/* 5. Total Expenses */}
              <div 
                onClick={() => setDiningSubTab('stock-alerts')}
                className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
                title="Click to inspect raw material expenses & kitchen stock"
              >
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">5. Total Expenses</span>
                <div>
                  <span className="text-xl lg:text-2xl font-black text-rose-600">
                    {currencySymbol}{(diningDashboardData?.metrics?.totalExpenses || totalExpensesAmount || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-rose-500 mt-1 block">
                    Purchases & wages
                  </span>
                </div>
              </div>

              {/* 6. Gross Profit */}
              <div 
                onClick={() => setDiningSubTab('sales-trends')}
                className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                title="Click to view turnover & gross margins"
              >
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">6. Gross Profit</span>
                <div>
                  <span className="text-xl lg:text-2xl font-black text-blue-700">
                    {currencySymbol}{(diningDashboardData?.metrics?.grossProfit || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 mt-1 block">
                    Sales − Food COGS
                  </span>
                </div>
              </div>

              {/* 7. Net Profit / Loss */}
              <div 
                onClick={() => setDiningSubTab('sales-trends')}
                className={`bg-white p-4 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group ${
                  (diningDashboardData?.metrics?.netProfit || 0) >= 0 ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-500' : 'border-rose-300 bg-rose-50/30 hover:border-rose-500'
                }`}
                title="Click to view profit ledger"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-600">
                  7. Net Profit / Loss
                </span>
                <div>
                  <span className={`text-xl lg:text-2xl font-black ${
                    (diningDashboardData?.metrics?.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {currencySymbol}{(diningDashboardData?.metrics?.netProfit || 0).toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-bold mt-1 block ${
                    (diningDashboardData?.metrics?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {(diningDashboardData?.metrics?.netProfit || 0) >= 0 ? '✓ Profitable' : '⚠ Deficit after ops'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── DINING OPERATIONS SUB-TABS NAVIGATION BAR ── */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDiningSubTab('live-orders')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    diningSubTab === 'live-orders'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Live Orders</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    diningSubTab === 'live-orders' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {activeOrdersCount} Active
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningSubTab('table-occupancy')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    diningSubTab === 'table-occupancy'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Table Occupancy</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    diningSubTab === 'table-occupancy' ? 'bg-amber-800 text-amber-100' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {occupiedTablesCount}/{displayedTables.length} Occupied
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningSubTab('overview')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    diningSubTab === 'overview'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Floor Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningSubTab('sales-trends')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    diningSubTab === 'sales-trends'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Sales & Trends</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningSubTab('stock-alerts')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    diningSubTab === 'stock-alerts'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Kitchen Stock</span>
                  {(diningDashboardData?.lowStockItems || []).length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      diningSubTab === 'stock-alerts' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {diningDashboardData.lowStockItems.length} Low
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pl-2">
                <span className="hidden sm:inline-block">Floor Status:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {availableTablesCount} Ready / {displayedTables.length} Total Tables
                </span>
              </div>
            </div>

            {/* ── SUB-TAB 1: LIVE ORDERS QUEUE ── */}
            {diningSubTab === 'live-orders' && (
              <div className="space-y-5 animate-fade-in">
                {/* Orders Filter & Controls Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setOrderMgmtStatusFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderMgmtStatusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All ({displayedOrders.length})
                      </button>
                      <button
                        onClick={() => setOrderMgmtStatusFilter('ACTIVE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderMgmtStatusFilter === 'ACTIVE' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Active / In Kitchen ({activeOrdersCount})
                      </button>
                      <button
                        onClick={() => setOrderMgmtStatusFilter('PLACED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderMgmtStatusFilter === 'PLACED' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        Placed ({placedOrdersCount})
                      </button>
                      <button
                        onClick={() => setOrderMgmtStatusFilter('PREPARING')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderMgmtStatusFilter === 'PREPARING' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Preparing ({preparingOrdersCount})
                      </button>
                      <button
                        onClick={() => setOrderMgmtStatusFilter('SERVED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderMgmtStatusFilter === 'SERVED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        Served ({servedOrdersCount})
                      </button>
                      <button
                        onClick={() => setOrderMgmtStatusFilter('PAID')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderMgmtStatusFilter === 'PAID' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Completed ({completedOrdersCount})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="/kitchen"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 no-underline border border-rose-200"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-rose-600" />
                        <span>Kitchen KDS ↗</span>
                      </a>
                      <button
                        onClick={() => handleOpenNewOrder()}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Take Table Order</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search dish, order #, table..."
                        value={orderSearchQuery}
                        onChange={e => setOrderSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <select
                        value={orderTableFilter}
                        onChange={e => setOrderTableFilter(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                      >
                        <option value="ALL">All Restaurant Tables</option>
                        {displayedTables.map(t => (
                          <option key={t.number} value={t.number}>Table {t.number}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={orderDateFilter}
                        onChange={e => setOrderDateFilter(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                      >
                        <option value="ALL">All Dates</option>
                        <option value="TODAY">Today's Orders</option>
                        <option value="YESTERDAY">Yesterday's Orders</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Orders Cards Grid */}
                {filteredManagementOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">No orders in this status</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Click below to create an order or switch table filters.</p>
                    <button
                      onClick={() => handleOpenNewOrder()}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Take New Order</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredManagementOrders.map(order => {
                      const subtotal = order.items?.reduce((s, i) => s + ((parseFloat(i.price) || 0) * (parseInt(i.quantity, 10) || 1)), 0) || order.totalPrice || 0;
                      const isSettled = order.status === 'PAID' || order.status === 'COMPLETED';
                      const tableNum = order.tableNumber || order.table_number;

                      return (
                        <div 
                          key={order.id} 
                          className={`bg-white rounded-2xl border shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-all ${
                            order.status === 'PLACED' ? 'border-blue-200 bg-blue-50/10' :
                            order.status === 'PREPARING' ? 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-200' :
                            order.status === 'SERVED' ? 'border-emerald-300 bg-emerald-50/15' :
                            'border-slate-200'
                          }`}
                        >
                          <div>
                            {/* Card Header: Table + Order ID + Status */}
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-black">
                                  Table {tableNum}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-400">#{order.id.slice(-6)}</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                order.status === 'PLACED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                order.status === 'SERVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {order.status === 'PLACED' ? 'Placed' :
                                 order.status === 'PREPARING' ? '👨‍🍳 Cooking' :
                                 order.status === 'SERVED' ? '🍽️ Served' :
                                 '✓ Paid'}
                              </span>
                            </div>

                            {/* Dishes List */}
                            <div className="divide-y divide-slate-100 my-3 max-h-36 overflow-y-auto pr-1">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => (
                                  <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                                    <span className="text-slate-800 font-medium">
                                      <strong className="text-amber-700 mr-1.5">{item.quantity}x</strong>
                                      {item.name || item.item_name}
                                    </span>
                                    <span className="font-mono font-bold text-slate-600">
                                      {currencySymbol}{((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)).toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 py-2">Dining Table Order</p>
                              )}
                            </div>
                          </div>

                          {/* Footer with Total and Fast Action Buttons */}
                          <div className="pt-3 border-t border-slate-100 mt-2">
                            <div className="flex justify-between items-baseline mb-3">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bill</span>
                              <span className="text-lg font-black text-slate-900 font-mono">
                                {currencySymbol}{parseFloat(subtotal).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Advancement Button */}
                              {order.status === 'PLACED' && (
                                <button
                                  onClick={async () => {
                                    await handleUpdateOrderStatusAction(order.id, 'PREPARING');
                                    showToast(`Table ${tableNum} order cooking`);
                                  }}
                                  className="flex-1 py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer text-center"
                                >
                                  👨‍🍳 Start Preparing
                                </button>
                              )}

                              {order.status === 'PREPARING' && (
                                <button
                                  onClick={async () => {
                                    await handleUpdateOrderStatusAction(order.id, 'SERVED');
                                    showToast(`Table ${tableNum} order marked Served`);
                                  }}
                                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer text-center"
                                >
                                  🍽️ Mark Served
                                </button>
                              )}

                              {(order.status === 'SERVED' || isSettled) && (
                                <button
                                  onClick={() => handleSettleOrder(order, tableNum)}
                                  className="flex-1 py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>{isSettled ? 'Print Bill' : 'Settle & Print'}</span>
                                </button>
                              )}

                              {/* Button to open dedicated table order screen to append dishes */}
                              <button
                                onClick={() => navigate(`/tables/${tableNum}/order`)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Open full menu to add dishes"
                              >
                                <Plus className="w-3 h-3 text-amber-600" />
                                <span>Add Dishes</span>
                              </button>

                              {/* View Receipt */}
                              <button
                                onClick={() => {
                                  setBillingOrder(order);
                                  setBillingTableNumber(tableNum);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                                title="View receipt modal"
                              >
                                Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SUB-TAB 2: TABLE OCCUPANCY & FLOOR PLAN ── */}
            {diningSubTab === 'table-occupancy' && (
              <div className="space-y-6 animate-fade-in">
                {/* Floor Status Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Tables</span>
                    <span className="text-2xl font-black text-slate-900">{displayedTables.length}</span>
                    <span className="text-[10px] font-medium text-slate-400 block mt-1">Full floor capacity</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Occupied / Eating</span>
                    <span className="text-2xl font-black text-amber-600">{occupiedTablesCount}</span>
                    <span className="text-[10px] font-bold text-amber-600 block mt-1 flex items-center">
                      <UtensilsCrossed className="w-3 h-3 mr-1" /> Active dining guests
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Available / Ready</span>
                    <span className="text-2xl font-black text-emerald-600">{availableTablesCount}</span>
                    <span className="text-[10px] font-bold text-emerald-600 block mt-1 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Ready for seating
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">Reserved Tables</span>
                    <span className="text-2xl font-black text-blue-600">{reservedTablesCount}</span>
                    <span className="text-[10px] font-bold text-blue-600 block mt-1">Upcoming bookings</span>
                  </div>
                </div>

                {/* Filter & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 mr-1">Filter Floor:</span>
                    <button
                      onClick={() => setTableFloorFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tableFloorFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({displayedTables.length})
                    </button>
                    <button
                      onClick={() => setTableFloorFilter('AVAILABLE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tableFloorFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Available ({availableTablesCount})
                    </button>
                    <button
                      onClick={() => setTableFloorFilter('OCCUPIED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tableFloorFilter === 'OCCUPIED' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Occupied ({occupiedTablesCount})
                    </button>
                    <button
                      onClick={() => setTableFloorFilter('RESERVED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tableFloorFilter === 'RESERVED' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      Reserved ({reservedTablesCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddTableModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Table</span>
                    </button>
                    <button
                      onClick={() => handleOpenNewOrder()}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Take New Order</span>
                    </button>
                  </div>
                </div>

                {/* Floor Tables Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFloorTables.map(table => {
                    const isOccupied = table.status === 'OCCUPIED';
                    const isReserved = table.status === 'RESERVED';
                    const currentOrder = displayedOrders.find(o => 
                      (table.currentOrderId && String(o.id) === String(table.currentOrderId)) || 
                      (Number(o.tableNumber) === Number(table.number) && o.status !== 'PAID')
                    );
                    const orderTotal = currentOrder?.totalPrice ?? currentOrder?.total ?? currentOrder?.items?.reduce((s, i) => s + ((parseFloat(i.price) || 0) * (parseInt(i.quantity, 10) || 1)), 0) ?? 0;

                    return (
                      <div
                        key={table.id || table.number}
                        className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between group hover:shadow-md ${
                          isOccupied
                            ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10'
                            : isReserved
                            ? 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/20'
                            : 'border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          {/* Top: Table Number + Capacity + Interactive Status Dropdown + New Tab Icon */}
                          <div className="flex items-center justify-between mb-3">
                            <div 
                              onClick={() => navigate(`/tables/${table.number}/order`)}
                              className="flex items-center gap-2.5 cursor-pointer"
                              title="Click to open dedicated order screen"
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                isOccupied
                                  ? 'bg-amber-100 text-amber-800'
                                  : isReserved
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                T{table.number}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                                  <span>Table {table.number}</span>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium">{table.capacity || 4} Seats</span>
                              </div>
                            </div>

                            {/* Status Selector */}
                            <div className="flex items-center gap-1">
                              <select
                                value={table.status || 'AVAILABLE'}
                                onChange={(e) => handleUpdateTableStatusAction(table.number, e.target.value)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none ${
                                  isOccupied
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : isReserved
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                <option value="AVAILABLE">Available</option>
                                <option value="OCCUPIED">Occupied</option>
                                <option value="RESERVED">Reserved</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => window.open(`/tables/${table.number}/order`, '_blank')}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Table Body Content */}
                          {isOccupied && currentOrder ? (
                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 mb-3 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-amber-950">Active Meal</span>
                                <span className="font-black text-amber-900 font-mono">
                                  {currencySymbol}{parseFloat(orderTotal).toFixed(2)}
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-800 line-clamp-2">
                                {currentOrder.items?.map(i => `${i.quantity}x ${i.name || i.item_name}`).join(', ') || 'Cooking in kitchen'}
                              </p>
                            </div>
                          ) : isReserved ? (
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 mb-3 text-xs text-blue-900 font-medium">
                              Table reserved for upcoming guests.
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Table is clean & ready for seating</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/tables/${table.number}/order`)}
                            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isOccupied ? 'Add Dishes / POS' : 'Take Order'}</span>
                          </button>

                          {isOccupied && currentOrder && (
                            <button
                              onClick={() => {
                                setBillingOrder(currentOrder);
                                setBillingTableNumber(table.number);
                              }}
                              className="px-2.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer"
                              title="Settle bill"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SUB-TAB 3: FLOOR OVERVIEW (Original Combined Executive View) ── */}
            {diningSubTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* ── SALES REPORTS & CHARTS (Daily, Weekly, Monthly) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 7-Day / Period Sales Trend Chart */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Restaurant Sales Trend</h3>
                        <p className="text-xs text-slate-500">Daily turnover and dining volume overview</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {['daily', 'weekly', 'monthly'].map(p => (
                          <button
                            key={p}
                            onClick={() => setSalesReportPeriod(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                              salesReportPeriod === p ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bar Chart - Real DB Records Only */}
                    <div className="pt-2">
                      {(diningDashboardData?.salesByDay && diningDashboardData.salesByDay.length > 0) ? (
                        <div className="h-44 flex items-end gap-3 sm:gap-6 px-2">
                          {diningDashboardData.salesByDay.map((day, dIdx) => {
                            const maxSales = Math.max(
                              ...diningDashboardData.salesByDay.map(d => Number(d.sales) || 0),
                              1
                            );
                            const sVal = Number(day.sales) || 0;
                            const heightPct = sVal > 0 ? Math.min(100, Math.max(12, Math.round((sVal / maxSales) * 100))) : 4;
                            return (
                              <div key={dIdx} className="flex-1 flex flex-col items-center gap-1.5 group">
                                <span className="text-[10px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {currencySymbol}{sVal}
                                </span>
                                <div className="w-full bg-slate-100 rounded-t-xl h-36 flex items-end overflow-hidden p-1">
                                  <div 
                                    className={`w-full rounded-t-lg transition-all duration-300 ${sVal > 0 ? 'bg-amber-500 group-hover:bg-amber-600' : 'bg-slate-200'}`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 uppercase">{day.label || day.date?.slice(-5)}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {day.orders || 0} ord
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-medium">
                          No sales recorded in this period.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 font-medium">
                      <span>7-Day Volume: <strong>{diningDashboardData?.salesByDay?.reduce((s, d) => s + (Number(d.orders) || 0), 0) || 0} Orders</strong></span>
                      <span>Avg Ticket: <strong>{currencySymbol}{diningDashboardData?.metrics?.totalOrders ? ((diningDashboardData?.metrics?.todaySales || 0) / diningDashboardData.metrics.totalOrders).toFixed(0) : '0'}</strong></span>
                      <span>Status: <strong className="text-emerald-600 font-bold">● Active Dining Floor</strong></span>
                    </div>
                  </div>

                  {/* Quick Floor Pulse & Low Stock Card */}
                  <div className="space-y-6">
                    {/* Table Floor Pulse */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Table Floor Pulse</h4>
                        <button
                          onClick={() => setDiningSubTab('table-occupancy')}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center cursor-pointer"
                        >
                          Floor Plan <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {displayedTables.slice(0, 11).map((tbl) => {
                          const occ = tbl.status === 'OCCUPIED';
                          const res = tbl.status === 'RESERVED';
                          return (
                            <div
                              key={tbl.number}
                              onClick={() => navigate(`/tables/${tbl.number}/order`)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer group hover:shadow-xs ${
                                occ
                                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                                  : res
                                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-emerald-300'
                              }`}
                              title={`Table ${tbl.number}: Click to open dedicated order screen`}
                            >
                              <span className="block text-xs font-black group-hover:text-amber-600 transition-colors">T{tbl.number}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                                occ ? 'text-amber-700' : res ? 'text-blue-700' : 'text-emerald-600'
                              }`}>
                                {occ ? 'Eating' : res ? 'Reserved' : 'Free'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                        <span>Occupied: <strong className="text-amber-600">{occupiedTablesCount}</strong></span>
                        <span>Reserved: <strong className="text-blue-600">{reservedTablesCount}</strong></span>
                        <span>Free: <strong className="text-emerald-600">{availableTablesCount}</strong></span>
                      </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Kitchen Stock Warnings</h4>
                        </div>
                        <button
                          onClick={() => setDiningSubTab('stock-alerts')}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                        >
                          Manage Stock ↗
                        </button>
                      </div>

                      {(diningDashboardData?.lowStockItems || []).length === 0 ? (
                        <div className="py-3 px-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>All ingredients and gas stock above minimum thresholds</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(diningDashboardData?.lowStockItems || []).map((item) => (
                            <div key={item.id} className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-amber-950 block">{item.item_name}</span>
                                <span className="text-[10px] text-amber-800 font-medium">
                                  Left: <strong>{item.quantity} {item.unit}</strong> (Min: {item.min_threshold} {item.unit})
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setRestockTargetItem(item);
                                  setRestockAddQuantity('');
                                  setShowRestockModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs"
                              >
                                Restock
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── LIVE RECENT ORDERS PREVIEW ── */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Live Orders</h3>
                      <p className="text-xs text-slate-500">Latest active and fulfilled table orders</p>
                    </div>
                    <button
                      onClick={() => setDiningSubTab('live-orders')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Open Live Orders Tab</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Order ID</th>
                          <th className="py-2.5 px-3">Table #</th>
                          <th className="py-2.5 px-3">Items Summary</th>
                          <th className="py-2.5 px-3">Total Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedOrders.slice(0, 6).map((ord) => {
                          const subtotal = ord.items?.reduce((s, i) => s + ((parseFloat(i.price) || 0) * (parseInt(i.quantity, 10) || 1)), 0) || ord.totalPrice || 0;
                          const itemsList = Array.isArray(ord.items) 
                            ? ord.items.map(i => `${i.quantity}x ${i.name || i.item_name}`).join(', ')
                            : 'Dining Order';
                          return (
                            <tr key={ord.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">#{ord.id.slice(-6)}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-[11px]">
                                  Table {ord.tableNumber || ord.table_number}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={itemsList}>
                                {itemsList}
                              </td>
                              <td className="py-3 px-3 font-black text-slate-900">{currencySymbol}{parseFloat(subtotal).toFixed(2)}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  ord.status === 'PLACED' ? 'bg-blue-100 text-blue-800' :
                                  ord.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                                  ord.status === 'SERVED' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setBillingOrder(ord);
                                    setBillingTableNumber(ord.tableNumber || ord.table_number);
                                  }}
                                  className="text-amber-600 hover:text-amber-700 font-bold text-xs cursor-pointer mr-2"
                                >
                                  View Bill
                                </button>
                                <button
                                  onClick={() => navigate(`/tables/${ord.tableNumber || ord.table_number}/order`)}
                                  className="text-slate-700 hover:text-slate-900 font-bold text-xs cursor-pointer"
                                >
                                  Add Dishes ↗
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB-TAB 4: SALES & TRENDS ── */}
            {diningSubTab === 'sales-trends' && (
              <div className="space-y-6 animate-fade-in">
                {/* Sales Trend Detailed Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Restaurant Sales & Turnover Analytics</h3>
                      <p className="text-xs text-slate-500">Live order volumes, revenue trends, and dining ticket values</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {['daily', 'weekly', 'monthly'].map(p => (
                        <button
                          key={p}
                          onClick={() => setSalesReportPeriod(p)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                            salesReportPeriod === p ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Revenue</span>
                      <span className="text-xl font-black text-slate-900">{currencySymbol}{(diningDashboardData?.metrics?.todaySales || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Volume</span>
                      <span className="text-xl font-black text-slate-900">{diningDashboardData?.salesByDay?.reduce((s, d) => s + (Number(d.orders) || 0), 0) || displayedOrders.length} Orders</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Order Ticket</span>
                      <span className="text-xl font-black text-emerald-600">{currencySymbol}{diningDashboardData?.metrics?.totalOrders ? ((diningDashboardData?.metrics?.todaySales || 0) / diningDashboardData.metrics.totalOrders).toFixed(0) : '0'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Profit</span>
                      <span className="text-xl font-black text-blue-600">{currencySymbol}{(diningDashboardData?.metrics?.grossProfit || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* High Resolution Bar Chart */}
                  <div className="pt-4">
                    {(diningDashboardData?.salesByDay && diningDashboardData.salesByDay.length > 0) ? (
                      <div className="h-56 flex items-end gap-3 sm:gap-8 px-4">
                        {diningDashboardData.salesByDay.map((day, dIdx) => {
                          const maxSales = Math.max(
                            ...diningDashboardData.salesByDay.map(d => Number(d.sales) || 0),
                            1
                          );
                          const sVal = Number(day.sales) || 0;
                          const heightPct = sVal > 0 ? Math.min(100, Math.max(12, Math.round((sVal / maxSales) * 100))) : 4;
                          return (
                            <div key={dIdx} className="flex-1 flex flex-col items-center gap-2 group">
                              <span className="text-xs font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                {currencySymbol}{sVal}
                              </span>
                              <div className="w-full bg-slate-100 rounded-t-2xl h-48 flex items-end overflow-hidden p-1.5">
                                <div 
                                  className={`w-full rounded-t-xl transition-all duration-300 ${sVal > 0 ? 'bg-amber-500 group-hover:bg-amber-600 shadow-xs' : 'bg-slate-200'}`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase">{day.label || day.date?.slice(-5)}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {day.orders || 0} orders
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-medium">
                        No sales recorded in this period.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB-TAB 5: KITCHEN STOCK & INVENTORY ALERTS ── */}
            {diningSubTab === 'stock-alerts' && (
              <div className="space-y-6 animate-fade-in">
                {/* Stock Health Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Ingredients Monitored</span>
                    <span className="text-2xl font-black text-slate-900">{inventoryList.length || (diningDashboardData?.lowStockItems?.length || 0)}</span>
                    <span className="text-xs text-slate-400 mt-1 block font-medium">Kitchen raw materials</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Low Stock Warnings</span>
                    <span className="text-2xl font-black text-amber-600">{(diningDashboardData?.lowStockItems || []).length}</span>
                    <span className="text-xs text-amber-600 mt-1 block font-bold">Below minimum threshold</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Kitchen Readiness</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {(diningDashboardData?.lowStockItems || []).length === 0 ? 'Optimal' : 'Restock Required'}
                    </span>
                    <span className="text-xs text-emerald-600 mt-1 block font-medium">Cooking inventory health</span>
                  </div>
                </div>

                {/* Warning Banner */}
                {(diningDashboardData?.lowStockItems || []).length > 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Restock Alert: {diningDashboardData.lowStockItems.length} Ingredients Need Immediate Replenishment</h4>
                      <p className="text-xs text-amber-800 mt-0.5 font-medium">
                        One or more key kitchen cooking ingredients are falling below the minimum safe threshold. Click "Restock" on any item below to update quantities.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-emerald-900 text-xs font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>All spices, meats, grains, vegetables, and LPG cylinder stocks are at healthy operating levels.</span>
                  </div>
                )}

                {/* Low Stock Items List */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Kitchen Stock Items</h3>
                      <p className="text-xs text-slate-500">Inventory levels and replenishment status</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('inventory-management')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Full Inventory Hub ↗</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(diningDashboardData?.lowStockItems && diningDashboardData.lowStockItems.length > 0) ? (
                      diningDashboardData.lowStockItems.map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black text-slate-900">{item.item_name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">Low Stock</span>
                            </div>
                            <span className="text-xs text-slate-600">
                              Current Stock: <strong className="text-rose-600">{item.quantity} {item.unit}</strong>
                            </span>
                            <span className="text-[11px] text-slate-400 block">Min Threshold: {item.min_threshold} {item.unit}</span>
                          </div>

                          <button
                            onClick={() => {
                              setRestockTargetItem(item);
                              setRestockAddQuantity('');
                              setShowRestockModal(true);
                            }}
                            className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer text-center"
                          >
                            + Restock Now
                          </button>
                        </div>
                      ))
                    ) : (
                      (inventoryList.length > 0 ? inventoryList.slice(0, 6) : [
                        { id: '1', item_name: 'Kolhapur Red Chilli Powder', quantity: 15, unit: 'kg', min_threshold: 5 },
                        { id: '2', item_name: 'Indrayani Rice (Bags)', quantity: 8, unit: 'bags', min_threshold: 3 },
                        { id: '3', item_name: 'Fresh Mutton (Kolhapuri)', quantity: 12, unit: 'kg', min_threshold: 5 },
                        { id: '4', item_name: 'Cooking Refined Oil', quantity: 20, unit: 'liters', min_threshold: 8 },
                        { id: '5', item_name: 'Commercial LPG Cylinder', quantity: 4, unit: 'cylinders', min_threshold: 2 },
                        { id: '6', item_name: 'Fresh Paneer', quantity: 6, unit: 'kg', min_threshold: 2 }
                      ]).map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black text-slate-900">{item.item_name || item.itemName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Normal</span>
                            </div>
                            <span className="text-xs text-slate-600">
                              Stock: <strong>{item.quantity} {item.unit}</strong>
                            </span>
                            <span className="text-[11px] text-slate-400 block">Min Safe Level: {item.min_threshold || item.minThreshold} {item.unit}</span>
                          </div>

                          <button
                            onClick={() => {
                              setRestockTargetItem(item);
                              setRestockAddQuantity('');
                              setShowRestockModal(true);
                            }}
                            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer text-center"
                          >
                            Add Stock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 2: ORDER MANAGEMENT CONSOLE (Filters, Status, Add Items) */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'order-management' || activeTab === 'live-orders') && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Order Management & Kitchen Fulfillment</h3>
                <p className="text-xs text-slate-500">Filter, update statuses, append dishes, and print table receipts</p>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="/kitchen"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 no-underline"
                >
                  <ChefHat className="w-3.5 h-3.5 text-rose-600" />
                  <span>Kitchen KDS ↗</span>
                </a>
                <button
                  onClick={() => handleOpenNewOrder()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Table Order</span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Date, Table, Status, Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search dish, guest, order #..."
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={orderMgmtStatusFilter}
                    onChange={e => setOrderMgmtStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="ALL">All Statuses ({displayedOrders.length})</option>
                    <option value="ACTIVE">Active (Unsettled)</option>
                    <option value="PLACED">Placed / Pending</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="SERVED">Served</option>
                    <option value="PAID">Completed / Paid</option>
                  </select>
                </div>

                {/* Table Filter */}
                <div>
                  <select
                    value={orderTableFilter}
                    onChange={e => setOrderTableFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="ALL">All Tables</option>
                    {displayedTables.map(t => (
                      <option key={t.number} value={t.number}>Table {t.number}</option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <select
                    value={orderDateFilter}
                    onChange={e => setOrderDateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="TODAY">Today's Orders</option>
                    <option value="YESTERDAY">Yesterday's Orders</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredManagementOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No orders match these filters</h4>
                <p className="text-xs text-slate-400 mt-1">Try clearing your filters or select a different table.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredManagementOrders.map(order => {
                  const subtotal = order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || order.totalPrice || 0;
                  const isSettled = order.status === 'PAID' || order.status === 'COMPLETED';

                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                              Table {order.tableNumber || order.table_number}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">#{order.id.slice(-6)}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'PLACED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'SERVED' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Order Items List */}
                        <div className="divide-y divide-slate-100 my-3">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                              <span className="text-slate-800 font-medium">
                                <strong className="text-amber-700 mr-1.5">{item.quantity}x</strong>
                                {item.name || item.item_name}
                              </span>
                              <span className="font-bold text-slate-700 font-mono">
                                {currencySymbol}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="p-2 rounded-lg bg-amber-50 text-[11px] text-amber-800 mb-3 border border-amber-100">
                            <strong>Note:</strong> {order.notes}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-xs text-slate-500">Order Subtotal:</span>
                          <span className="text-sm font-black text-slate-900">{currencySymbol}{parseFloat(subtotal).toFixed(2)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {!isSettled && (
                            <button
                              onClick={() => handleOpenAddItems(order, order.tableNumber || order.table_number)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Add more items to this order"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Items</span>
                            </button>
                          )}

                          {order.status === 'PLACED' && (
                            <button
                              onClick={async () => {
                                await handleUpdateOrderStatusAction(order.id, 'PREPARING');
                                showToast(`Order #${order.id.slice(-6)} set to Preparing`);
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer text-center"
                            >
                              Start Preparing
                            </button>
                          )}

                          {order.status === 'PREPARING' && (
                            <button
                              onClick={async () => {
                                await handleUpdateOrderStatusAction(order.id, 'SERVED');
                                showToast(`Order #${order.id.slice(-6)} marked Served`);
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer text-center"
                            >
                              Mark Served
                            </button>
                          )}

                          {(order.status === 'SERVED' || isSettled) && (
                            <button
                              onClick={() => handleSettleOrder(order, order.tableNumber || order.table_number)}
                              className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>{isSettled ? 'Print Bill' : 'Settle & Print'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
{/* TAB: DINING TABLES & FLOOR PLAN                             */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'table-management' || activeTab === 'dining-tables') && (
          <div className="p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Dining Floor & Table Status</h3>
                <p className="text-xs text-slate-500">Live floor occupancy, active table orders, and billing turnover</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenNewOrder()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Table Order</span>
                </button>
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Dining Table</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Tables</span>
                <span className="text-2xl font-black text-slate-900">{displayedTables.length}</span>
                <span className="text-[10px] font-bold text-slate-400 block mt-1">Floor capacity</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Occupied / Dining</span>
                <span className="text-2xl font-black text-amber-600">{occupiedTablesCount}</span>
                <span className="text-[10px] font-bold text-amber-600 block mt-1 flex items-center">
                  <UtensilsCrossed className="w-3 h-3 mr-1" /> Active meals
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Available Tables</span>
                <span className="text-2xl font-black text-emerald-600">
                  {displayedTables.filter(t => t.status === 'AVAILABLE' || (!t.status && t.status !== 'OCCUPIED' && t.status !== 'RESERVED')).length}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Ready for seating
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Reserved Tables</span>
                <span className="text-2xl font-black text-blue-600">
                  {displayedTables.filter(t => t.status === 'RESERVED').length}
                </span>
                <span className="text-[10px] font-bold text-blue-600 block mt-1">Reserved guests</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Kitchen Orders</span>
                <span className="text-2xl font-black text-purple-600">{displayedOrders.filter(o => o.status !== 'PAID').length}</span>
                <span className="text-[10px] font-bold text-purple-600 block mt-1">Placed / Preparing</span>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedTables.map(table => {
                const isOccupied = table.status === 'OCCUPIED';
                const isReserved = table.status === 'RESERVED';
                const currentOrder = displayedOrders.find(o => 
                  (table.currentOrderId && String(o.id) === String(table.currentOrderId)) || 
                  (Number(o.tableNumber) === Number(table.number) && o.status !== 'PAID')
                );
                const orderTotal = currentOrder?.totalPrice ?? currentOrder?.total ?? currentOrder?.items?.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0) ?? 0;

                return (
                  <div
                    key={table.id || table.number}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between group hover:shadow-md ${
                      isOccupied
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : isReserved
                        ? 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Header: Table Number + Capacity + Interactive Status Selector + New Tab Button */}
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          onClick={() => navigate(`/tables/${table.number}/order`)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isOccupied
                              ? 'bg-amber-100 text-amber-800'
                              : isReserved
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            T{table.number}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                              <span>Table {table.number}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">{table.capacity || 4} Seats</span>
                          </div>
                        </div>

                        {/* Interactive Status Selector */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={table.status || 'AVAILABLE'}
                            onChange={(e) => handleUpdateTableStatusAction(table.number, e.target.value)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none ${
                              isOccupied
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : isReserved
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="RESERVED">Reserved</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => window.open(`/tables/${table.number}/order`, '_blank')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Open dedicated ordering screen in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Body */}
                      {isOccupied ? (
                        currentOrder ? (
                          <div 
                            onClick={() => navigate(`/tables/${table.number}/order`)}
                            className="my-3 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs cursor-pointer hover:bg-amber-100/70 transition-colors"
                            title="Click to view & manage order"
                          >
                            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-amber-200/70">
                              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                                Order #{currentOrder.id.length > 8 ? currentOrder.id.slice(-6).toUpperCase() : currentOrder.id}
                              </span>
                              <select
                                value={currentOrder.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdateOrderStatusAction(currentOrder.id, e.target.value)}
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border cursor-pointer focus:outline-none ${
                                  currentOrder.status === 'PLACED' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                                  currentOrder.status === 'PREPARING' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                  currentOrder.status === 'SERVED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                  currentOrder.status === 'COMPLETED' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                                  'bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                              >
                                <option value="PLACED">Pending</option>
                                <option value="PREPARING">Preparing</option>
                                <option value="SERVED">Served</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            </div>

                            {/* Ordered Items List */}
                            <div className="space-y-1.5 my-2 max-h-24 overflow-y-auto pr-1">
                              {currentOrder.items && currentOrder.items.length > 0 ? (
                                currentOrder.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs text-slate-800">
                                    <span className="font-bold truncate mr-2">
                                      <span className="text-amber-800 mr-1.5 font-black">{item.quantity}×</span>
                                      {item.name}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600 font-semibold shrink-0">
                                      {currencySymbol}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[11px] text-slate-500 italic">No items listed</div>
                              )}
                            </div>

                            {/* Bill Total */}
                            <div className="flex justify-between items-center pt-2 border-t border-amber-200/80 mt-2">
                              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">Bill Total:</span>
                              <span className="text-base font-black text-amber-950 font-mono">
                                {currencySymbol}{orderTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => navigate(`/tables/${table.number}/order`)}
                            className="my-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 font-medium cursor-pointer hover:bg-amber-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 mb-1 font-bold text-amber-800 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Guests Seated (Occupied)
                            </div>
                            <p className="text-[11px] text-slate-500">Click to open dedicated order screen & take order</p>
                          </div>
                        )
                      ) : isReserved ? (
                        <div 
                          onClick={() => navigate(`/tables/${table.number}/order`)}
                          className="my-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 font-medium cursor-pointer hover:bg-blue-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 mb-1 font-bold text-blue-800 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Reserved for Guests
                          </div>
                          <p className="text-[11px] text-slate-500">Click to open order screen or seat guests</p>
                        </div>
                      ) : (
                        <div 
                          onClick={() => navigate(`/tables/${table.number}/order`)}
                          className="my-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-400 font-medium text-center cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 hover:text-emerald-800 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                          Table is clean & ready for guests
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      {isOccupied ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/tables/${table.number}/order`)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            title="Open dedicated order management screen"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>{currentOrder ? 'Order Screen' : 'Take Order'}</span>
                          </button>

                          {currentOrder && (
                            <button
                              onClick={() => handleSettleOrder(currentOrder, table.number)}
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                              title="Generate Bill & Settle"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleFreeTableAction(table.number)}
                            className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                            title="Free Table"
                          >
                            Free
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-2">
                          <button
                            onClick={() => navigate(`/tables/${table.number}/order`)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Take Order</span>
                          </button>
                          <button
                            onClick={() => window.open(`/tables/${table.number}/order`, '_blank')}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTableAction(table.number)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                            title="Delete Table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB: RESTAURANT MENU & BESTSELLERS                          */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'menu-management' || activeTab === 'dining-menu') && (
          <div className="p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">Restaurant Menu & Bestsellers</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {hotelMenuItems.length} Items Listed
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Manage dishes, descriptions, dietary classification, and ⭐ Bestseller pins for {dashboardData?.hotel?.name || 'this property'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href={`/menu?hotel=${dashboardData?.hotel?.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Customer Menu View ↗</span>
                </a>
                <button
                  onClick={() => setShowAddDishModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Menu Item</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search dish by name, ingredients, or spices..."
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['ALL', ...new Set(hotelMenuItems.map(i => i.category))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      menuCategoryFilter === cat
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} {cat === 'ALL' ? `(${hotelMenuItems.length})` : `(${hotelMenuItems.filter(i => i.category === cat).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dish / Item Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-center">Bestseller Pin</th>
                      <th className="px-4 py-3 text-center">Availability</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hotelMenuItems
                      .filter(item => {
                        const matchCat = menuCategoryFilter === 'ALL' || item.category === menuCategoryFilter;
                        const matchSearch = !menuSearch.trim() || 
                          item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
                        return matchCat && matchSearch;
                      })
                      .map(item => {
                        const isVeg = item.dietaryTags?.includes('VEG') || 
                          (!item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('mutton') && !item.name.toLowerCase().includes('anda'));
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border ${
                                isVeg ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-rose-600 bg-rose-50 text-rose-600'
                              }`} title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}>
                                <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.isBestseller && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-black">
                                    ⭐ PINNED
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                              {currencySymbol}{item.price}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggleBestseller(item.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  item.isBestseller
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                              >
                                {item.isBestseller ? '★ Bestseller' : '☆ Pin'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  item.isAvailable !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.isAvailable !== false ? 'Available' : 'Sold Out'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteMenuItem(item.id, item.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Dish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
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



      
        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 5: SALES & BILLING (Settled Invoices & Daily Reports)    */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'sales-billing' || activeTab === 'financials') && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Sales & Billing Ledger</h3>
                <p className="text-xs text-slate-500">Settled restaurant bills, tax liabilities, and receipt reprinting</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    const settled = displayedOrders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED');
                    let csv = "Invoice ID,Date,Table,Items Count,Total Amount,Status\n";
                    settled.forEach(o => {
                      const tot = o.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || o.totalPrice || 0;
                      csv += `${o.id.slice(-6)},${(o.created_at || o.createdAt || '').slice(0, 10)},Table ${o.tableNumber || o.table_number},${o.items?.length || 1},${tot},${o.status}\n`;
                    });
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dining-sales-ledger.csv`;
                    a.click();
                    showToast('Exported settled sales ledger to CSV');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Sales CSV</span>
                </button>
              </div>
            </div>

            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Today's Dining Sales</span>
                <span className="text-2xl font-black text-slate-900">{currencySymbol}{(diningDashboardData?.metrics?.todaySales || 0).toLocaleString()}</span>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">Invoiced at tables today</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Settled Invoices</span>
                <span className="text-2xl font-black text-indigo-600">
                  {displayedOrders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED').length}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Fully paid receipts</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gross Cumulative Sales</span>
                <span className="text-2xl font-black text-emerald-600">
                  {currencySymbol}{displayedOrders.reduce((sum, o) => {
                    const t = o.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || o.totalPrice || 0;
                    return sum + parseFloat(t);
                  }, 0).toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">All table orders ledger</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Unsettled Bills</span>
                <span className="text-2xl font-black text-amber-600">
                  {currencySymbol}{displayedOrders.filter(o => o.status !== 'PAID' && o.status !== 'COMPLETED').reduce((sum, o) => {
                    const t = o.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || o.totalPrice || 0;
                    return sum + parseFloat(t);
                  }, 0).toLocaleString()}
                </span>
                <p className="text-[11px] text-amber-700 mt-1">Dining in progress</p>
              </div>
            </div>

            {/* Settled Bills History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Invoices & Settlement History</h4>
                <span className="text-xs text-slate-400">Click any row to print or inspect bill</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Table</th>
                      <th className="py-3 px-4">Dishes & Quantity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedOrders.map(order => {
                      const total = order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || order.totalPrice || 0;
                      const isPaid = order.status === 'PAID' || order.status === 'COMPLETED';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{order.id.slice(-6)}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-black">
                              Table {order.tableNumber || order.table_number}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                            <span className="truncate block">
                              {order.items?.map(i => `${i.quantity}x ${i.name || i.item_name}`).join(', ') || 'Dining Meal'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">{currencySymbol}{parseFloat(total).toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setBillingOrder(order);
                                setBillingTableNumber(order.tableNumber || order.table_number);
                              }}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print Bill</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 6: RESTAURANT EXPENSES                                   */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Restaurant Expense Tracker</h3>
                <p className="text-xs text-slate-500">Record purchases: meat, poultry, dairy, produce, LPG fuel, and wages</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record New Expense</span>
                </button>
              </div>
            </div>

            {/* Expense KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-rose-700 block mb-1">Total Recorded Expenses</span>
                <span className="text-2xl font-black text-rose-600">{currencySymbol}{totalExpensesAmount.toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">{expensesList.length} expense vouchers</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Top Expense Category</span>
                <span className="text-xl font-black text-slate-900">
                  {Object.entries(expenseCategories).sort((a,b) => b[1] - a[1])[0]?.[0] || 'No expenses recorded'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {currencySymbol}{(Object.entries(expenseCategories).sort((a,b) => b[1] - a[1])[0]?.[1] || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Raw Food (COGS)</span>
                <span className="text-2xl font-black text-amber-600">
                  {currencySymbol}{(
                    (expenseCategories['Meat & Poultry'] || 0) + 
                    (expenseCategories['Vegetables'] || 0) + 
                    (expenseCategories['Dairy'] || 0) +
                    (expenseCategories['Raw Materials / Groceries'] || 0)
                  ).toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Direct food costs</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Category Filter:</span>
                <select
                  value={expenseCategoryFilter}
                  onChange={e => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Raw Materials / Groceries">Raw Materials / Groceries</option>
                  <option value="Gas & Utilities">Gas & Utilities</option>
                  <option value="Staff Wages">Staff Wages</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <span className="text-xs text-slate-500 font-medium">Showing {expensesList.length} expenses</span>
            </div>

            {/* Expense Records Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                          No expenses recorded yet. Click "Record New Expense" to add your first expense voucher.
                        </td>
                      </tr>
                    ) : (
                      expensesList.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-600">{exp.expense_date || exp.expenseDate || exp.created_at?.slice(0, 10)}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{exp.title}</span>
                            {exp.notes && <span className="text-[10px] text-slate-400 block">{exp.notes}</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-slate-600">{exp.payment_method || exp.paymentMethod}</span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-rose-600">{currencySymbol}{parseFloat(exp.amount).toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteExpenseAction(exp.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 7: PROFIT & LOSS REPORTS                                 */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'profit-loss' && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Restaurant Profit & Loss Reports</h3>
                <p className="text-xs text-slate-500">Revenue vs Raw Food COGS vs Operating Expenses = Net Profit Margin</p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['daily', 'weekly', 'monthly'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      plPeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* P&L Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Operating Revenue</span>
                <span className="text-2xl font-black text-slate-900">{currencySymbol}{(plReportData?.totalRevenue || 0).toLocaleString()}</span>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">Confirmed food sales</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cost of Goods Sold (COGS)</span>
                <span className="text-2xl font-black text-rose-600">{currencySymbol}{(plReportData?.cogs || 0).toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">Raw meat, produce & groceries</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gross Profit</span>
                <span className="text-2xl font-black text-blue-600">{currencySymbol}{(plReportData?.grossProfit || 0).toLocaleString()}</span>
                <p className="text-[11px] text-blue-600 font-bold mt-1">
                  Margin: {plReportData?.grossMarginPercent || 0}%
                </p>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${
                (plReportData?.netProfit || 0) >= 0 ? 'bg-emerald-50/30 border-emerald-300' : 'bg-rose-50/30 border-rose-300'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Net Profit / (Loss)</span>
                <span className={`text-2xl font-black ${(plReportData?.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {currencySymbol}{(plReportData?.netProfit || 0).toLocaleString()}
                </span>
                <p className={`text-[11px] font-bold mt-1 ${(plReportData?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Net Margin: {plReportData?.netMarginPercent || 0}%
                </p>
              </div>
            </div>

            {/* Financial Statement Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Income Statement Breakdown ({plPeriod.toUpperCase()})
              </h4>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                {/* Revenue */}
                <div className="pt-2 flex justify-between items-center font-bold text-slate-900">
                  <span>1. Gross Restaurant Revenue (Food & Dining)</span>
                  <span className="font-mono text-sm">{currencySymbol}{(plReportData?.totalRevenue || 0).toFixed(2)}</span>
                </div>

                {/* COGS */}
                <div className="pt-3 flex justify-between items-center text-slate-700">
                  <span className="pl-4">Less: Cost of Goods Sold (Meat, Veg, Dairy, Spices)</span>
                  <span className="font-mono text-rose-600 font-bold">−{currencySymbol}{(plReportData?.cogs || 0).toFixed(2)}</span>
                </div>

                {/* Gross Profit */}
                <div className="pt-3 flex justify-between items-center font-black text-slate-900 bg-slate-50 p-2.5 rounded-xl">
                  <span>Gross Operating Profit</span>
                  <span className="font-mono text-sm text-blue-700">{currencySymbol}{(plReportData?.grossProfit || 0).toFixed(2)}</span>
                </div>

                {/* Operating Expenses */}
                <div className="pt-3 flex justify-between items-center text-slate-700">
                  <span className="pl-4">Less: Operating Expenses (Gas/LPG, Utilities, Salaries, Maintenance)</span>
                  <span className="font-mono text-rose-600 font-bold">−{currencySymbol}{(plReportData?.operatingExpenses || 0).toFixed(2)}</span>
                </div>

                {/* Net Profit */}
                <div className={`pt-3 flex justify-between items-center font-black p-3 rounded-xl ${
                  (plReportData?.netProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                }`}>
                  <span className="text-sm">Net Profit / (Loss)</span>
                  <span className="font-mono text-base font-black">
                    {currencySymbol}{(plReportData?.netProfit || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
{/* TAB 7: STAFF MANAGEMENT & DAILY ATTENDANCE                  */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'staff-attendance' || activeTab === 'staff') && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Main Header with Sub-tabs and Registration */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Hotel Staff & Daily Operations</h3>
                <p className="text-xs text-slate-500">Track daily employee attendance, shifts, leave records, and team roster</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Switcher Pills */}
                <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setStaffSubTab('attendance')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      staffSubTab === 'attendance'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Daily Attendance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffSubTab('directory')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      staffSubTab === 'directory'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Staff Directory</span>
                  </button>
                </div>

                {(isSuperAdmin || hasPermission('STAFF', 'can_add')) && (
                  <button
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Staff</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── SUB-TAB 1: DAILY ATTENDANCE MANAGEMENT ── */}
            {staffSubTab === 'attendance' && (
              <div className="space-y-6">
                {/* Date Controls & Filter Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Interactive Date Navigator */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleShiftAttendanceDay(-1)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Previous Day"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="px-2 py-1 text-xs font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => handleShiftAttendanceDay(1)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Next Day"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSetAttendanceToday}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        attendanceDate === new Date().toISOString().split('T')[0]
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-black'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Today
                    </button>

                    <div className="text-xs font-bold text-slate-500 hidden sm:block pl-1">
                      {new Date(attendanceDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Right: Quick Batch Actions & Search */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Shift Filter Pills */}
                    <div className="flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold">
                      {['ALL', 'MORNING', 'EVENING', 'NIGHT'].map(sh => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => setStaffShiftFilter(sh)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            staffShiftFilter === sh
                              ? 'bg-white text-slate-900 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {sh === 'ALL' ? 'All Shifts' : sh}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={staffSearchQuery}
                        onChange={e => setStaffSearchQuery(e.target.value)}
                        placeholder="Filter by name / role..."
                        className="w-44 sm:w-52 pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>

                    {/* Mark All Present Button */}
                    <button
                      type="button"
                      onClick={handleBatchMarkAllPresent}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Quickly mark all active staff as Present for this day"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mark All Present</span>
                    </button>
                  </div>
                </div>

                {/* Daily Attendance Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {/* Total Staff */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
                      <span className="text-xl font-black text-slate-900">{attendanceSummary.totalStaff}</span>
                    </div>
                  </div>

                  {/* Present */}
                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
                      <span className="text-xl font-black text-emerald-700">{attendanceSummary.present}</span>
                    </div>
                  </div>

                  {/* Absent */}
                  <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
                      <span className="text-xl font-black text-rose-700">{attendanceSummary.absent}</span>
                    </div>
                  </div>

                  {/* Half Day */}
                  <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Half Day</span>
                      <span className="text-xl font-black text-amber-800">{attendanceSummary.halfDay}</span>
                    </div>
                  </div>

                  {/* On Leave */}
                  <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">On Leave</span>
                      <span className="text-xl font-black text-purple-800">{attendanceSummary.leave}</span>
                    </div>
                  </div>
                </div>

                {/* Staff Attendance List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">Staff Attendance Roster</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        {filteredStaffAttendance.length} staff
                      </span>
                    </div>
                    {attendanceSummary.unmarked > 0 && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        ⚠️ {attendanceSummary.unmarked} staff pending attendance for today
                      </span>
                    )}
                  </div>

                  {filteredStaffAttendance.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-medium">
                      No staff members match the selected filters.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredStaffAttendance.map(member => {
                        const status = member.attendance_status;
                        const isPresent = status === 'PRESENT';
                        const isAbsent = status === 'ABSENT';
                        const isHalfDay = status === 'HALF_DAY';
                        const isLeave = status === 'LEAVE';
                        const isUnmarked = !status || status === 'UNMARKED';

                        return (
                          <div
                            key={member.staff_id || member.id}
                            className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/70 ${
                              isAbsent ? 'bg-rose-50/20' : isPresent ? 'bg-emerald-50/15' : ''
                            }`}
                          >
                            {/* Staff Member Info */}
                            <div className="flex items-center gap-3.5 min-w-[240px]">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                member.shift === 'MORNING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                member.shift === 'EVENING' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                                'bg-slate-100 border-slate-300 text-slate-800'
                              }`}>
                                {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900">{member.name}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                    member.shift === 'MORNING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    member.shift === 'EVENING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {member.shift || 'MORNING'}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">{member.role}</p>
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {member.phone || member.email || 'No contact specified'}
                                </p>
                              </div>
                            </div>

                            {/* Current Status Badge */}
                            <div className="flex items-center gap-2 min-w-[130px]">
                              {isPresent && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Present
                                </span>
                              )}
                              {isAbsent && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  Absent
                                </span>
                              )}
                              {isHalfDay && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Half Day
                                </span>
                              )}
                              {isLeave && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
                                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                                  On Leave
                                </span>
                              )}
                              {isUnmarked && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-dashed border-slate-300">
                                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                                  Unmarked
                                </span>
                              )}
                              {member.notes && (
                                <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]" title={member.notes}>
                                  "{member.notes}"
                                </span>
                              )}
                            </div>

                            {/* Quick Attendance Marking Actions */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Quick 1-Click Present */}
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(member, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer border ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200 hover:border-emerald-300'
                                }`}
                                title="Mark Present"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Present</span>
                              </button>

                              {/* Quick 1-Click Absent */}
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(member, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer border ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                    : 'bg-white hover:bg-rose-50 text-rose-700 border-slate-200 hover:border-rose-300'
                                }`}
                                title="Mark Absent"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Absent</span>
                              </button>

                              {/* Dropdown for Half Day / Leave / Edit */}
                              <select
                                value={status === 'UNMARKED' ? '' : status}
                                onChange={e => {
                                  if (e.target.value) {
                                    handleMarkAttendance(member, e.target.value);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 cursor-pointer focus:outline-none"
                              >
                                <option value="" disabled>Status ▾</option>
                                <option value="PRESENT">Present</option>
                                <option value="ABSENT">Absent</option>
                                <option value="HALF_DAY">Half Day</option>
                                <option value="LEAVE">Leave</option>
                              </select>

                              {/* Monthly History Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenMonthlyHistory(member)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="View monthly attendance history"
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-slate-600" />
                                <span>History</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SUB-TAB 2: STAFF DIRECTORY ROSTER ── */}
            {staffSubTab === 'directory' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
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

                    <button
                      type="button"
                      onClick={() => handleOpenMonthlyHistory(s)}
                      className="w-full mt-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                      <span>Monthly Attendance</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        
        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 9: INVENTORY MANAGEMENT                                  */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'inventory-management' && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Kitchen Inventory & Stock Levels</h3>
                <p className="text-xs text-slate-500">Track key ingredients, LPG cylinders, minimum thresholds, and stock valuation</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowAddInventoryModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stock Item</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Tracked Items</span>
                <span className="text-2xl font-black text-slate-900">{inventoryStats.totalItems}</span>
                <p className="text-[11px] text-slate-500 mt-1">Ingredients & fuel units</p>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${
                inventoryStats.lowStockCount > 0 ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-slate-200'
              }`}>
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1">Low Stock Alerts</span>
                <span className="text-2xl font-black text-amber-700">{inventoryStats.lowStockCount}</span>
                <p className="text-[11px] text-amber-600 font-bold mt-1">Requires immediate restocking</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Inventory Valuation</span>
                <span className="text-2xl font-black text-emerald-600">{currencySymbol}{inventoryStats.totalValuation.toLocaleString()}</span>
                <p className="text-[11px] text-slate-500 mt-1">Current assets on hand</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Category:</span>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={e => setInventoryCategoryFilter(e.target.value)}
                    className="px-3 py-1 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Grains & Rice">Grains & Rice</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Spices & Oils">Spices & Oils</option>
                    <option value="Fuel & Gas">Fuel & Gas</option>
                  </select>
                </div>

                <span className="text-xs text-slate-400 font-medium">Click Restock to replenish item quantity</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Min. Alert Level</th>
                      <th className="py-3 px-4">Cost / Unit</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryList.map(item => {
                      const isLow = item.quantity <= item.min_threshold;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{item.item_name || item.itemName}</td>
                          <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {item.quantity} <span className="font-normal text-slate-500">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{item.min_threshold} {item.unit}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{currencySymbol}{parseFloat(item.cost_per_unit || 0).toFixed(2)}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setRestockTargetItem(item);
                                  setRestockAddQuantity('');
                                  setShowRestockModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => handleDeleteInventoryAction(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB 10: HOTEL ROOM MANAGEMENT (Secondary Module)          */}
        {/* ─────────────────────────────────────────────────────────── */}
        {(activeTab === 'hotel-rooms' || activeTab === 'bookings' || activeTab === 'rooms' || activeTab === 'customers') && (
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in">
            {/* Notice Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Secondary Hotel Operations</span>
                <p className="text-xs font-medium mt-0.5">Hotel room reservations, room cleaning inventory, and guest CRM ledger</p>
              </div>

              {/* Sub-tab pills */}
              <div className="flex p-1 rounded-xl bg-white border border-blue-200 text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRoomSubTab('inventory')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    roomSubTab === 'inventory' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>Room Inventory</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomSubTab('reservations')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    roomSubTab === 'reservations' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Reservations</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomSubTab('guests')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    roomSubTab === 'guests' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Guest CRM</span>
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Room Inventory */}
            {roomSubTab === 'inventory' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Room Inventory & Matrix</h4>
                    <p className="text-xs text-slate-500">Live room statuses, floor allocation, and pricing</p>
                  </div>
                  {(isSuperAdmin || hasPermission('ROOMS', 'can_add')) && (
                    <button
                      onClick={() => setShowAddRoomModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Room to Inventory
                    </button>
                  )}
                </div>

                {rooms.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium text-xs">
                    No rooms currently configured for this hotel property.
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* Sub-tab 2: Reservations */}
            {roomSubTab === 'reservations' && (
              <div className="space-y-6">
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

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {bookings.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium text-xs">
                      No reservations recorded.
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 3: Guest CRM */}
            {roomSubTab === 'guests' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Guest & Customer Directory</h4>
                  <p className="text-xs text-slate-500">Historical guest profile, contact details, and lifetime spending</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {customers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium text-xs">
                      No guest records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
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
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: PROPERTY SETTINGS                                    */}
        {/* ─────────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && dashboardData && (
          <div className="p-8 max-w-3xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Hotel Property Configuration & Policies</h3>
                <p className="text-xs text-slate-500">Manage hotel profile, contact information, tax rates, and active/inactive operational status.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleHotelPropertyStatus}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    dashboardData.hotel.status === 'ACTIVE'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                  title={dashboardData.hotel.status === 'ACTIVE' ? 'Deactivate Hotel' : 'Activate Hotel'}
                >
                  <span className={`w-2 h-2 rounded-full ${dashboardData.hotel.status === 'ACTIVE' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span>{dashboardData.hotel.status === 'ACTIVE' ? 'Deactivate Hotel' : 'Activate Hotel'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenEditHotelModal}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Property Name</span>
                <span className="text-sm font-bold text-slate-900">{dashboardData.hotel.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Operational Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    dashboardData.hotel.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dashboardData.hotel.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {dashboardData.hotel.status === 'ACTIVE' ? 'Active & Open' : 'Inactive / Closed'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Public Guest Menu</span>
                <a
                  href={`/menu?hotel=${dashboardData.hotel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 no-underline"
                >
                  <span>/{dashboardData.hotel.slug}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Concierge / Contact Phone</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {dashboardData.hotel.contactPhone || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Contact Email</span>
                <span className="text-sm font-mono text-slate-700">
                  {dashboardData.hotel.contactEmail || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Settlement Currency</span>
                <span className="text-sm font-bold text-slate-900">{dashboardData.hotel.currency} ({currencySymbol})</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Default Room & Dining Tax</span>
                <span className="text-sm font-bold text-slate-900">{dashboardData.hotel.taxPercentage}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        


      {/* ── RECORD RESTAURANT EXPENSE MODAL ── */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddExpenseModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Record Restaurant Expense</h3>
                <p className="text-xs text-slate-500">Add food raw materials, LPG, or operational expense</p>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15kg Fresh Chicken, Commercial Gas Cylinder"
                  value={newExpenseForm.title}
                  onChange={e => setNewExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category *</label>
                  <select
                    value={newExpenseForm.category}
                    onChange={e => setNewExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600 bg-white cursor-pointer"
                  >
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Raw Materials / Groceries">Raw Materials / Groceries</option>
                    <option value="Gas & Utilities">Gas & Utilities</option>
                    <option value="Staff Wages">Staff Wages</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 3500"
                    value={newExpenseForm.amount}
                    onChange={e => setNewExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={newExpenseForm.paymentMethod}
                    onChange={e => setNewExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600 bg-white cursor-pointer"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={newExpenseForm.expenseDate}
                    onChange={e => setNewExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Notes / Vendor (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Kolhapur Poultry Wholesaler"
                  value={newExpenseForm.notes}
                  onChange={e => setNewExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Save Expense Voucher
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD INVENTORY STOCK ITEM MODAL ── */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddInventoryModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Kitchen Stock Item</h3>
                <p className="text-xs text-slate-500">Track raw materials and minimum stock alerts</p>
              </div>
              <button onClick={() => setShowAddInventoryModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddInventorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indrayani Rice, Paneer"
                  value={newInventoryForm.itemName}
                  onChange={e => setNewInventoryForm(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category *</label>
                  <select
                    value={newInventoryForm.category}
                    onChange={e => setNewInventoryForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600 bg-white cursor-pointer"
                  >
                    <option value="Grains & Rice">Grains & Rice</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Spices & Oils">Spices & Oils</option>
                    <option value="Fuel & Gas">Fuel & Gas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unit</label>
                  <select
                    value={newInventoryForm.unit}
                    onChange={e => setNewInventoryForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600 bg-white cursor-pointer"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="liter">liter (Liters)</option>
                    <option value="cylinder">cylinder</option>
                    <option value="packet">packet / bundle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Initial Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="e.g. 25"
                    value={newInventoryForm.quantity}
                    onChange={e => setNewInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Min. Alert Level *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    placeholder="e.g. 5"
                    value={newInventoryForm.minThreshold}
                    onChange={e => setNewInventoryForm(prev => ({ ...prev, minThreshold: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cost Per Unit ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 80"
                  value={newInventoryForm.costPerUnit}
                  onChange={e => setNewInventoryForm(prev => ({ ...prev, costPerUnit: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Add Inventory Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK RESTOCK MODAL ── */}
      {showRestockModal && restockTargetItem && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowRestockModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Restock Item</h3>
                <p className="text-xs text-slate-500">Replenish stock for {restockTargetItem.item_name || restockTargetItem.itemName}</p>
              </div>
              <button onClick={() => setShowRestockModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Current Stock: <strong>{restockTargetItem.quantity} {restockTargetItem.unit}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Quantity to Add ({restockTargetItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  autoFocus
                  placeholder="e.g. 10"
                  value={restockAddQuantity}
                  onChange={e => setRestockAddQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}

{/* ── ADD TABLE MODAL ── */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddTableModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Dining Table</h3>
                <p className="text-xs text-slate-500">Configure new table on dining floor</p>
              </div>
              <button onClick={() => setShowAddTableModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Table Number *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 11"
                  value={newTableNum}
                  onChange={e => setNewTableNum(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={e => setNewTableCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Add Table to Floor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD MENU ITEM (DISH) MODAL ── */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddDishModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Menu Item</h3>
                <p className="text-xs text-slate-500">Create new dish for {dashboardData?.hotel?.name || 'this property'}</p>
              </div>
              <button onClick={() => setShowAddDishModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dish / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutton Handi Special"
                  value={newDishForm.name}
                  onChange={e => setNewDishForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category *</label>
                  <select
                    value={newDishForm.category}
                    onChange={e => setNewDishForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="Veg Starter">Veg Starter</option>
                    <option value="Veg Kabab">Veg Kabab</option>
                    <option value="Veg Main Course">Veg Main Course</option>
                    <option value="Veg Soup">Veg Soup</option>
                    <option value="Chinese Veg">Chinese Veg</option>
                    <option value="Chinese Non-Veg">Chinese Non-Veg</option>
                    <option value="Main Course (Non-Veg)">Main Course (Non-Veg)</option>
                    <option value="Non Veg Handi Special">Non Veg Handi Special</option>
                    <option value="Roti Special">Roti Special</option>
                    <option value="Rice">Rice</option>
                    <option value="Desserts & Beverages">Desserts & Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    placeholder="220"
                    value={newDishForm.price}
                    onChange={e => setNewDishForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description / Ingredients</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, preparation style, spice level or Half/Full notes..."
                  value={newDishForm.description}
                  onChange={e => setNewDishForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newDishForm.isVeg}
                    onChange={e => setNewDishForm(prev => ({ ...prev, isVeg: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newDishForm.isBestseller}
                    onChange={e => setNewDishForm(prev => ({ ...prev, isBestseller: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>⭐ Pin as Bestseller</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
              >
                Add Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE / ADD ITEMS TO TABLE ORDER MODAL ── */}
      {showTableOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto" onClick={() => setShowTableOrderModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                  T{orderingTableNumber || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeExistingOrderId 
                      ? `Add Items to Table ${orderingTableNumber}` 
                      : `Create Order for Table ${orderingTableNumber}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeExistingOrderId 
                      ? `Appending dishes to existing Order #${activeExistingOrderId.slice(-6).toUpperCase()}` 
                      : `Select food items, adjust quantities, and send order directly to kitchen`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTableOrderModal(false);
                  setOrderCart([]);
                }}
                className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Two-Pane Split Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              {/* Left Column: Menu Item Selector (7 cols) */}
              <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto flex flex-col max-h-[55vh] lg:max-h-[68vh]">
                {/* Table Number Selector (Only when creating new order) */}
                {!activeExistingOrderId && (
                  <div className="mb-4 flex items-center gap-3">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">
                      Target Table:
                    </label>
                    <select
                      value={orderingTableNumber || ''}
                      onChange={e => setOrderingTableNumber(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {displayedTables.map(t => (
                        <option key={t.id || t.number} value={t.number}>
                          Table {t.number} ({t.status === 'OCCUPIED' ? 'Occupied' : 'Available'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={orderItemSearch}
                    onChange={e => setOrderItemSearch(e.target.value)}
                    placeholder="Search dishes by name or category..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                  {orderItemSearch && (
                    <button
                      onClick={() => setOrderItemSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
                  {orderModalCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOrderItemCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                        orderItemCategory === cat
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dishes Grid */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredOrderDishes.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No menu items match your search.
                    </div>
                  ) : (
                    filteredOrderDishes.map(dish => {
                      const inCart = orderCart.find(i => (i.menuItemId || i.id) === dish.id);
                      const qty = inCart ? inCart.quantity : 0;
                      const isNonVeg = ((dish.category || '') + (dish.name || '')).toLowerCase().includes('chicken') ||
                                       ((dish.category || '') + (dish.name || '')).toLowerCase().includes('mutton') ||
                                       ((dish.category || '') + (dish.name || '')).toLowerCase().includes('fish') ||
                                       ((dish.category || '') + (dish.name || '')).toLowerCase().includes('egg') ||
                                       ((dish.category || '') + (dish.name || '')).toLowerCase().includes('non-veg');

                      return (
                        <div
                          key={dish.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                              isNonVeg ? 'border-rose-500' : 'border-emerald-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isNonVeg ? 'bg-rose-500' : 'bg-emerald-600'}`} />
                            </span>
                            <div className="truncate">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{dish.name}</h5>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                {dish.category} · {currencySymbol}{parseFloat(dish.price).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {qty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleOrderCartRemove(dish.id)}
                                  className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 cursor-pointer shadow-xs"
                                >
                                  −
                                </button>
                                <span className="text-xs font-black px-1.5 text-slate-900">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOrderCartAdd(dish)}
                                  className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 cursor-pointer shadow-xs"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOrderCartAdd(dish)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary & Auto Calculation (5 cols) */}
              <div className="lg:col-span-5 p-6 bg-slate-50/70 flex flex-col justify-between max-h-[55vh] lg:max-h-[68vh] overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Order Items ({orderCart.reduce((s, i) => s + i.quantity, 0)})
                    </span>
                    {orderCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setOrderCart([])}
                        className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Selected Cart Items */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {orderCart.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No dishes selected yet.<br/>Click "+ Add" on items to build the order.
                      </div>
                    ) : (
                      orderCart.map(item => (
                        <div
                          key={item.menuItemId || item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <h6 className="text-xs font-bold text-slate-900 truncate">{item.name}</h6>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {currencySymbol}{item.price.toFixed(2)} each
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleOrderCartRemove(item.menuItemId || item.id)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer"
                              >
                                −
                              </button>
                              <span className="text-xs font-black px-1 text-slate-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleOrderCartAdd(item)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-black text-slate-900 w-16 text-right">
                              {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOrderCartDelete(item.menuItemId || item.id)}
                              className="text-slate-400 hover:text-rose-600 text-xs p-1 cursor-pointer"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Bill Breakdown & Submit Actions */}
                <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">{currencySymbol}{orderCartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Tax / GST ({orderTaxRate}%):</span>
                    <span className="font-bold text-slate-900">{currencySymbol}{orderCartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-900 font-black pt-1.5 border-t border-slate-200">
                    <span className="uppercase tracking-wider">Total Bill Amount:</span>
                    <span className="text-base text-amber-700">{currencySymbol}{orderCartTotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTableOrderModal(false);
                        setOrderCart([]);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={orderCart.length === 0 || orderSubmitting}
                      onClick={handleSubmitTableOrder}
                      className="flex-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {orderSubmitting ? (
                        <span>Saving...</span>
                      ) : activeExistingOrderId ? (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add to Order</span>
                        </>
                      ) : (
                        <>
                          <UtensilsCrossed className="w-4 h-4" />
                          <span>Send to Kitchen</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT HOTEL DETAILS MODAL ── */}
      {showEditHotelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Hotel Properties</h3>
                <p className="text-xs text-slate-500">Update property name, contact details, and tax</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditHotelModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHotelSettings} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Property Name *</label>
                <input
                  type="text"
                  required
                  value={editHotelForm.name}
                  onChange={e => setEditHotelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Hotel Lay Bhari"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={editHotelForm.contactPhone}
                    onChange={e => setEditHotelForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="e.g. 898789798"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    value={editHotelForm.contactEmail}
                    onChange={e => setEditHotelForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="e.g. contact@hotel.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Currency</label>
                  <select
                    value={editHotelForm.currency}
                    onChange={e => setEditHotelForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Tax / GST (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editHotelForm.taxPercentage}
                    onChange={e => setEditHotelForm(prev => ({ ...prev, taxPercentage: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Tenant Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditHotelForm(prev => ({ ...prev, status: 'ACTIVE' }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      editHotelForm.status === 'ACTIVE'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditHotelForm(prev => ({ ...prev, status: 'INACTIVE' }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      editHotelForm.status === 'INACTIVE'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditHotelModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHotel}
                  className="flex-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {savingHotel ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MONTHLY ATTENDANCE HISTORY MODAL ── */}
      {showHistoryModal && historyStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {historyStaff.name ? historyStaff.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{historyStaff.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
                      {historyStaff.shift} Shift
                    </span>
                  </div>
                  <p className="text-xs font-bold text-amber-600">{historyStaff.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {historyStaff.phone || historyStaff.email || 'No contact'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Month Selector & Summary Stats */}
            <div className="p-6 border-b border-slate-200 space-y-4 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Period</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShiftHistoryMonth(-1)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black text-slate-900 min-w-[130px] text-center">
                    {new Date(historyMonth + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleShiftHistoryMonth(1)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Monthly Stats Cards */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Days</span>
                  <span className="text-base font-black text-slate-900">
                    {monthlyHistoryData?.stats?.totalDaysMarked ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase block">Present</span>
                  <span className="text-base font-black text-emerald-800">
                    {monthlyHistoryData?.stats?.present ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[9px] font-bold text-rose-600 uppercase block">Absent</span>
                  <span className="text-base font-black text-rose-800">
                    {monthlyHistoryData?.stats?.absent ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[9px] font-bold text-amber-700 uppercase block">Half Day</span>
                  <span className="text-base font-black text-amber-900">
                    {monthlyHistoryData?.stats?.halfDay ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                  <span className="text-[9px] font-bold text-purple-700 uppercase block">Leave</span>
                  <span className="text-base font-black text-purple-900">
                    {monthlyHistoryData?.stats?.leave ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase block">Attendance</span>
                  <span className="text-base font-black text-indigo-900">
                    {monthlyHistoryData?.stats?.attendancePercentage ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Day-by-Day History Record Log */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Detailed Daily Logs</span>
                <span className="text-[11px] text-slate-400">Click dropdown to correct any day</span>
              </div>

              {historyLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
              ) : !monthlyHistoryData?.history || monthlyHistoryData.history.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No attendance records recorded for this staff member in {new Date(historyMonth + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {monthlyHistoryData.history.map(row => (
                    <div key={row.id || row.attendance_date} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-black text-slate-900 block">
                          {new Date(row.attendance_date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        {row.notes && (
                          <span className="text-[11px] text-slate-400 italic">"{row.notes}"</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={row.status}
                          onChange={e => handleUpdateHistoricalAttendance(row.attendance_date, e.target.value)}
                          className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider border cursor-pointer focus:outline-none ${
                            row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            row.status === 'ABSENT' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            row.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            'bg-purple-100 text-purple-900 border-purple-300'
                          }`}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="HALF_DAY">Half Day</option>
                          <option value="LEAVE">Leave</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BILLING & SETTLEMENT MODAL ── */}
      {billingOrder && (
        <BillModal
          order={billingOrder}
          tableNumber={billingTableNumber}
          hotelName={dashboardData?.hotel?.name || authHotelName || 'Hotel Lay Bhari'}
          currencySymbol={currencySymbol}
          taxPercentage={dashboardData?.hotel?.taxPercentage || 10}
          contactPhone={dashboardData?.hotel?.contactPhone || ''}
          contactEmail={dashboardData?.hotel?.contactEmail || ''}
          onClose={() => {
            setBillingOrder(null);
            setBillingTableNumber(null);
          }}
          onSettle={async () => {
            if (billingOrder) {
              await updateOrderStatus(billingOrder.id, 'PAID');
              await handleFreeTableAction(billingTableNumber);
              setBillingOrder(null);
              setBillingTableNumber(null);
              showToast(`Table ${billingTableNumber} bill settled and table is now free!`);
              fetchHotelTables();
              fetchHotelOrders();
            }
          }}
        />
      )}
    </div>
  );
}
