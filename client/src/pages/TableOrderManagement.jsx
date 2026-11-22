import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../SocketContext';
import BillModal from '../components/BillModal';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Search,
  UtensilsCrossed,
  Receipt,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChefHat,
  Sparkles,
  RefreshCw,
  Save,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function TableOrderManagement() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const currentTableNum = parseInt(tableNumber, 10);

  const {
    hotelName: authHotelName,
    hotelCurrency: authCurrency,
    hotelSlug: authHotelSlug,
    hotelId: authHotelId,
    isSuperAdmin
  } = useAuth();

  const {
    tables,
    orders,
    isConnected,
    placeOrder,
    updateOrderStatus,
    freeTable,
    refreshData
  } = useSocket();

  // Menu & Hotel State
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [hotelProfile, setHotelProfile] = useState(null);

  // Cart & Order Form State
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dietaryFilter, setDietaryFilter] = useState('ALL'); // 'ALL', 'VEG', 'NON_VEG'
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Bill & Order Actions State
  const [showBillModal, setShowBillModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [updatingPlacedItem, setUpdatingPlacedItem] = useState(false);
  const [tableStatusUpdating, setTableStatusUpdating] = useState(false);

  // Category Slider Ref
  const categoryScrollRef = useRef(null);

  // Resolved tenant details
  const effectiveSlug = authHotelSlug || 'laybhari';
  const effectiveHotelId = authHotelId || '0a4fabc0-0b95-467b-a22c-252aec59f9c7';
  const currencySymbol = authCurrency || hotelProfile?.currency_symbol || (hotelProfile?.currency === 'INR' ? '₹' : '₹');
  const taxRate = hotelProfile?.tax_percentage !== undefined ? parseFloat(hotelProfile.tax_percentage) : 10;
  const hotelDisplayName = hotelProfile?.name || authHotelName || 'Hotel Lay Bhari';

  const [directTables, setDirectTables] = useState([]);
  const [directOrders, setDirectOrders] = useState([]);

  const showToastMsg = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    const headers = { 'X-Auth-Token': token };
    const curHotelId = effectiveHotelId || localStorage.getItem('auth_hotel_id');
    if (curHotelId) headers['x-hotel-id'] = curHotelId;
    return headers;
  };

  // Direct fetch tables and orders
  const fetchTableAndOrders = async () => {
    try {
      const headers = getAuthHeaders();
      const [tRes, oRes] = await Promise.all([
        fetch('/api/tables', { headers }),
        fetch('/api/orders/active', { headers })
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData)) setDirectTables(tData);
      }
      if (oRes.ok) {
        const oData = await oRes.json();
        if (Array.isArray(oData)) setDirectOrders(oData);
      }
    } catch (e) {
      console.warn('Error fetching tables/orders directly:', e);
    }
  };

  useEffect(() => {
    fetchTableAndOrders();
  }, [currentTableNum]);

  // 1. Fetch hotel profile and menu items
  useEffect(() => {
    let isMounted = true;
    const fetchHotelAndMenu = async () => {
      setMenuLoading(true);
      try {
        // Fetch Hotel Details
        const hotelRes = await fetch(`/api/hotels/${encodeURIComponent(effectiveSlug)}`);
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json();
          if (isMounted) {
            setHotelProfile(hotelData.hotel || null);
            if (hotelData.menuItems && hotelData.menuItems.length > 0) {
              setMenuItems(hotelData.menuItems);
            }
          }
        }

        // Fetch Menu Items explicitly
        const menuRes = await fetch(`/api/hotels/${encodeURIComponent(effectiveSlug)}/menu`);
        if (menuRes.ok) {
          const mData = await menuRes.json();
          if (isMounted && mData.items) {
            setMenuItems(mData.items);
          }
        }
      } catch (err) {
        console.error('Error loading menu:', err);
      } finally {
        if (isMounted) setMenuLoading(false);
      }
    };

    fetchHotelAndMenu();
    return () => { isMounted = false; };
  }, [effectiveSlug]);

  const combinedTables = directTables.length > 0 ? directTables : tables;
  const combinedOrders = useMemo(() => {
    const map = new Map();
    (directOrders || []).forEach(o => map.set(o.id, o));
    (orders || []).forEach(o => {
      if (map.has(o.id)) map.set(o.id, { ...map.get(o.id), ...o });
      else map.set(o.id, o);
    });
    return Array.from(map.values());
  }, [directOrders, orders]);

  // 2. Identify the target table and its active order
  const currentTable = useMemo(() => {
    return combinedTables.find(t => 
      Number(t.number) === currentTableNum && 
      (!t.hotelId || t.hotelId === effectiveHotelId)
    ) || combinedTables.find(t => Number(t.number) === currentTableNum) || {
      number: currentTableNum,
      capacity: 4,
      status: 'AVAILABLE'
    };
  }, [combinedTables, currentTableNum, effectiveHotelId]);

  const activeOrder = useMemo(() => {
    return combinedOrders.find(o => 
      Number(o.tableNumber) === currentTableNum && 
      (!o.hotelId || o.hotelId === effectiveHotelId) &&
      o.status !== 'PAID' && 
      o.status !== 'COMPLETED' &&
      o.status !== 'CANCELLED'
    ) || null;
  }, [combinedOrders, currentTableNum, effectiveHotelId]);

  // Derive categories from actual menu items
  const categories = useMemo(() => {
    const unique = new Set(menuItems.map(i => i.category).filter(Boolean));
    return ['ALL', 'BESTSELLERS', ...Array.from(unique)];
  }, [menuItems]);

  // Filtered menu items
  const filteredDishes = useMemo(() => {
    return menuItems.filter(item => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc) return false;
      }

      // Category filter
      if (selectedCategory === 'BESTSELLERS') {
        if (!item.isBestseller) return false;
      } else if (selectedCategory !== 'ALL') {
        if (item.category !== selectedCategory) return false;
      }

      // Dietary filter
      const isNonVeg = ((item.category || '') + (item.name || '')).toLowerCase().includes('chicken') ||
                       ((item.category || '') + (item.name || '')).toLowerCase().includes('mutton') ||
                       ((item.category || '') + (item.name || '')).toLowerCase().includes('fish') ||
                       ((item.category || '') + (item.name || '')).toLowerCase().includes('egg') ||
                       ((item.category || '') + (item.name || '')).toLowerCase().includes('non-veg');
      if (dietaryFilter === 'VEG' && isNonVeg) return false;
      if (dietaryFilter === 'NON_VEG' && !isNonVeg) return false;

      return true;
    });
  }, [menuItems, searchQuery, selectedCategory, dietaryFilter]);

  // Cart Management
  const addToCart = (dish) => {
    setCart(prev => {
      const existing = prev.find(i => (i.menuItemId || i.id) === dish.id);
      if (existing) {
        return prev.map(i =>
          (i.menuItemId || i.id) === dish.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          id: dish.id,
          menuItemId: dish.id,
          name: dish.name,
          category: dish.category,
          price: parseFloat(dish.price),
          quantity: 1
        }
      ];
    });
  };

  const removeFromCart = (dishId) => {
    setCart(prev => {
      const existing = prev.find(i => (i.menuItemId || i.id) === dishId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter(i => (i.menuItemId || i.id) !== dishId);
      }
      return prev.map(i =>
        (i.menuItemId || i.id) === dishId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
  };

  const deleteFromCart = (dishId) => {
    setCart(prev => prev.filter(i => (i.menuItemId || i.id) !== dishId));
  };

  // Financial Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const activeOrderSubtotal = useMemo(() => {
    if (!activeOrder || !activeOrder.items) return 0;
    return activeOrder.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)), 0);
  }, [activeOrder]);

  const totalOrderSubtotal = activeOrderSubtotal + cartSubtotal;
  const currentCartTax = (cartSubtotal * taxRate) / 100;
  const totalOrderTax = (totalOrderSubtotal * taxRate) / 100;
  const totalPayable = totalOrderSubtotal + totalOrderTax;

  // Change Table Status directly (Available / Occupied / Reserved)
  const handleUpdateTableStatus = async (newStatus) => {
    setTableStatusUpdating(true);
    try {
      const res = await fetch(`/api/tables/${currentTableNum}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ 
          status: newStatus,
          currentOrderId: newStatus === 'AVAILABLE' ? null : (activeOrder ? activeOrder.id : undefined)
        })
      });
      if (res.ok) {
        showToastMsg(`Table ${currentTableNum} status set to ${newStatus}`);
        fetchTableAndOrders();
        if (refreshData) refreshData();
      } else {
        showToastMsg('Failed to update table status', 'error');
      }
    } catch (err) {
      showToastMsg('Error updating table status', 'error');
    } finally {
      setTableStatusUpdating(false);
    }
  };

  // Change Active Order Status (PLACED / PREPARING / SERVED / COMPLETED)
  const handleUpdateOrderStatus = async (newStatus) => {
    if (!activeOrder) return;
    try {
      if (updateOrderStatus) updateOrderStatus(activeOrder.id, newStatus);
      const res = await fetch(`/api/orders/${activeOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToastMsg(`Order marked as ${newStatus}`);
        fetchTableAndOrders();
        if (refreshData) refreshData();
      }
    } catch {
      showToastMsg('Failed to update order status', 'error');
    }
  };

  // Category Horizontal Slider Controls
  const handleScrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryWheel = (e) => {
    if (categoryScrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      categoryScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleSelectCategory = (cat, e) => {
    setSelectedCategory(cat);
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Update quantity on already placed item in kitchen
  const handleUpdatePlacedItemQuantity = async (itemIdx, delta) => {
    if (!activeOrder || !activeOrder.items || !activeOrder.items[itemIdx]) return;
    const targetItem = activeOrder.items[itemIdx];
    const newQty = (parseInt(targetItem.quantity, 10) || 1) + delta;

    let newItems;
    if (newQty <= 0) {
      if (!window.confirm(`Remove "${targetItem.name}" from Table ${currentTableNum} order?`)) return;
      newItems = activeOrder.items.filter((_, idx) => idx !== itemIdx);
    } else {
      newItems = activeOrder.items.map((it, idx) =>
        idx === itemIdx ? { ...it, quantity: newQty } : it
      );
    }

    setUpdatingPlacedItem(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ items: newItems })
      });
      if (res.ok) {
        const updated = await res.json();
        if (newItems.length === 0 || updated.status === 'CANCELLED') {
          showToastMsg(`All items removed. Table ${currentTableNum} order cancelled and table freed.`);
        } else {
          showToastMsg(`Updated "${targetItem.name}" quantity to ${newQty > 0 ? newQty : 0}`);
        }
        fetchTableAndOrders();
        if (refreshData) refreshData();
      } else {
        showToastMsg('Failed to update placed item', 'error');
      }
    } catch {
      showToastMsg('Error communicating with server', 'error');
    } finally {
      setUpdatingPlacedItem(false);
    }
  };

  // Remove mistakenly added dish from placed order
  const handleRemovePlacedItem = async (itemIdx) => {
    if (!activeOrder || !activeOrder.items || !activeOrder.items[itemIdx]) return;
    const targetItem = activeOrder.items[itemIdx];
    const isLastItem = activeOrder.items.length === 1;

    const confirmMsg = isLastItem
      ? `"${targetItem.name}" is the only dish on this order. Removing it will cancel the order and free Table ${currentTableNum}. Proceed?`
      : `Remove "${targetItem.name}" from Table ${currentTableNum} order?`;

    if (!window.confirm(confirmMsg)) return;

    const newItems = activeOrder.items.filter((_, idx) => idx !== itemIdx);

    setUpdatingPlacedItem(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ items: newItems })
      });
      if (res.ok) {
        const updated = await res.json();
        if (newItems.length === 0 || updated.status === 'CANCELLED') {
          showToastMsg(`Order cancelled and Table ${currentTableNum} is now Available.`);
        } else {
          showToastMsg(`Removed "${targetItem.name}" from order.`);
        }
        fetchTableAndOrders();
        if (refreshData) refreshData();
      } else {
        showToastMsg('Failed to remove item', 'error');
      }
    } catch {
      showToastMsg('Error communicating with server', 'error');
    } finally {
      setUpdatingPlacedItem(false);
    }
  };

  // Cancel entire active order mistakenly created
  const handleCancelActiveOrder = async () => {
    if (!activeOrder) return;
    setCancellingOrder(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.ok) {
        showToastMsg(`Order #${activeOrder.id.slice(-6).toUpperCase()} cancelled. Table ${currentTableNum} is now Available.`);
        setShowCancelModal(false);
        setCart([]);
        setOrderNotes('');
        fetchTableAndOrders();
        if (refreshData) refreshData();
      } else {
        showToastMsg('Failed to cancel order', 'error');
      }
    } catch {
      showToastMsg('Error cancelling order', 'error');
    } finally {
      setCancellingOrder(false);
    }
  };

  // Submit Order / Append Items
  const handleSubmitOrder = async (desiredStatus = 'PLACED') => {
    if (cart.length === 0) {
      showToastMsg('Please add at least one item to the cart', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (activeOrder) {
        // Appending to existing active order
        const res = await fetch(`/api/orders/${activeOrder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ items: cart })
        });

        if (res.ok) {
          if (desiredStatus === 'PREPARING' && activeOrder.status === 'PLACED') {
            await fetch(`/api/orders/${activeOrder.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ status: 'PREPARING' })
            });
          }
          setCart([]);
          setOrderNotes('');
          showToastMsg(`Added ${cart.length} items to Table ${currentTableNum} order!`);
          fetchTableAndOrders();
          if (refreshData) refreshData();
        } else {
          const err = await res.json().catch(() => ({}));
          showToastMsg(err.error || 'Failed to add items to order', 'error');
        }
      } else {
        // Creating fresh order for table
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            tableNumber: currentTableNum,
            items: cart,
            notes: orderNotes,
            hotelId: effectiveHotelId
          })
        });

        if (res.ok) {
          const created = await res.json();
          if (desiredStatus === 'PREPARING' && created.id) {
            await fetch(`/api/orders/${created.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ status: 'PREPARING' })
            });
          }
          setCart([]);
          setOrderNotes('');
          showToastMsg(`Order created for Table ${currentTableNum}! Sent to kitchen.`);
          fetchTableAndOrders();
          if (refreshData) refreshData();
        } else {
          const err = await res.json().catch(() => ({}));
          showToastMsg(err.error || 'Failed to create order', 'error');
        }
      }
    } catch (err) {
      showToastMsg('Network error while processing order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Settle Bill Action
  const handleSettleBill = async () => {
    if (!activeOrder) return;
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'PAID' })
      });
      if (res.ok) {
        if (freeTable) await freeTable(currentTableNum);
        setShowBillModal(false);
        showToastMsg(`Order #${activeOrder.id.slice(-6).toUpperCase()} settled. Table ${currentTableNum} is now Available!`);
        fetchTableAndOrders();
        if (refreshData) refreshData();
      }
    } catch {
      showToastMsg('Failed to settle bill', 'error');
    }
  };

  // Print Kitchen Order Ticket (KOT)
  const handlePrintKOT = () => {
    const itemsToPrint = cart.length > 0 ? cart : (activeOrder?.items || []);
    if (itemsToPrint.length === 0) {
      showToastMsg('No items to print on KOT ticket', 'error');
      return;
    }

    const rows = itemsToPrint.map(i =>
      `<tr>
        <td style="padding:6px 8px; font-weight:bold; font-size:14px;">${i.quantity}×</td>
        <td style="padding:6px 8px; font-size:14px;">${i.name}</td>
        <td style="padding:6px 8px; font-size:12px; color:#555;">${i.category || ''}</td>
       </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>KOT - Table ${currentTableNum} - ${hotelDisplayName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; max-width: 300px; margin: 16px auto; color: #000; }
    h2 { text-align: center; margin: 0 0 4px 0; font-size: 18px; text-transform: uppercase; }
    .badge { text-align: center; font-size: 22px; font-weight: 900; background: #000; color: #fff; padding: 6px; margin: 8px 0; border-radius: 4px; }
    p { margin: 2px 0; font-size: 11px; text-align: center; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    .notes { font-style: italic; font-size: 12px; padding: 6px; border: 1px solid #ccc; margin-top: 8px; }
  </style>
</head>
<body>
  <h2>KITCHEN ORDER TICKET (KOT)</h2>
  <p>${hotelDisplayName}</p>
  <div class="badge">TABLE ${currentTableNum}</div>
  <p>${new Date().toLocaleString('en-IN')}</p>
  <hr/>
  <table>
    <thead>
      <tr style="border-bottom: 1px solid #000; font-size: 11px; text-align:left;">
        <th>QTY</th><th>ITEM</th><th>CAT</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${orderNotes ? `<div class="notes"><strong>Kitchen Notes:</strong> ${orderNotes}</div>` : ''}
  <hr/>
  <p style="font-size:10px; opacity:0.7;">Sent by Hotel Owner POS Console</p>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=380,height=520');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  };

  const isOccupied = currentTable.status === 'OCCUPIED' || !!activeOrder;
  const isReserved = currentTable.status === 'RESERVED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-900 text-rose-100 border-rose-700'
            : 'bg-slate-900 text-amber-300 border-slate-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ── TOP NAV & TABLE STATUS CONSOLE ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back Link & Table Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/hotel-dashboard?tab=table-management')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Return to Table Floor Plan"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Floor Plan</span>
            </button>

            <div className="h-6 w-px bg-slate-200" />

            {/* Table Badge */}
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                isOccupied
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : isReserved
                  ? 'bg-blue-600 text-white shadow-blue-600/20'
                  : 'bg-emerald-600 text-white shadow-emerald-600/20'
              }`}>
                T{currentTableNum}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Table {currentTableNum}
                  </h1>
                  {/* Table Switcher Quick Dropdown */}
                  <select
                    value={currentTableNum}
                    onChange={(e) => navigate(`/tables/${e.target.value}/order`)}
                    className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none"
                    title="Switch to another table"
                  >
                    {tables.length > 0 ? (
                      tables.map(t => (
                        <option key={t.number} value={t.number}>
                          Switch to Table {t.number} ({t.status || 'AVAILABLE'})
                        </option>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                        <option key={n} value={n}>Table {n}</option>
                      ))
                    )}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {currentTable.capacity || 4} Guest Seats · {hotelDisplayName}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Table Status Toggle & Live Indicators */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Table Status Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 pl-1.5">Status:</span>
              <button
                disabled={tableStatusUpdating}
                onClick={() => handleUpdateTableStatus('AVAILABLE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  !isOccupied && !isReserved
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>Available</span>
              </button>

              <button
                disabled={tableStatusUpdating}
                onClick={() => handleUpdateTableStatus('OCCUPIED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isOccupied
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>Occupied</span>
              </button>

              <button
                disabled={tableStatusUpdating}
                onClick={() => handleUpdateTableStatus('RESERVED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isReserved
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                <span>Reserved</span>
              </button>
            </div>

            {/* Active Order Quick Status Pill (if exists) */}
            {activeOrder && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                  Order #{activeOrder.id.slice(-6).toUpperCase()}:
                </span>
                <select
                  value={activeOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none ${
                    activeOrder.status === 'PLACED' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                    activeOrder.status === 'PREPARING' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    activeOrder.status === 'SERVED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    activeOrder.status === 'COMPLETED' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                    'bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <option value="PLACED">Pending</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="SERVED">Served</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            )}

            {/* WebSocket Pulse */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isConnected ? 'POS Live' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN TWO-COLUMN POS WORKSPACE ── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT COLUMN: RESTAURANT MENU EXPLORER (7 Cols) ── */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Search, Category Filter, and Dietary Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            {/* Search Bar & Pure Veg Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes by name, category, or spices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-amber-600 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Pure Veg / Non Veg Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                <button
                  onClick={() => setDietaryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dietaryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietaryFilter('VEG')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    dietaryFilter === 'VEG' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Pure Veg</span>
                </button>
                <button
                  onClick={() => setDietaryFilter('NON_VEG')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    dietaryFilter === 'NON_VEG' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* Category Scroll Bar with Left & Right Slide Controls */}
            <div className="relative flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleScrollCategories('left')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-2xs"
                title="Slide categories left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={categoryScrollRef}
                onWheel={handleCategoryWheel}
                className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 text-xs scroll-smooth scrollbar-thin scrollbar-thumb-slate-300"
                style={{ scrollbarWidth: 'thin' }}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = cat === 'ALL'
                    ? menuItems.length
                    : cat === 'BESTSELLERS'
                    ? menuItems.filter(i => i.isBestseller).length
                    : menuItems.filter(i => i.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => handleSelectCategory(cat, e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'BESTSELLERS' ? '⭐ Bestsellers' : cat}
                      <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleScrollCategories('right')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-2xs"
                title="Slide categories right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dishes List / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Menu Items ({filteredDishes.length})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Click "+ Add" to build order
              </span>
            </div>

            {menuLoading ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40" />
                Loading hotel menu...
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No dishes found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[calc(100vh-320px)] min-h-[420px] overflow-y-auto pr-2 pb-24 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
                {filteredDishes.map((dish) => {
                  const inCart = cart.find(i => (i.menuItemId || i.id) === dish.id);
                  const qtyInCart = inCart ? inCart.quantity : 0;
                  const isNonVeg = ((dish.category || '') + (dish.name || '')).toLowerCase().includes('chicken') ||
                                   ((dish.category || '') + (dish.name || '')).toLowerCase().includes('mutton') ||
                                   ((dish.category || '') + (dish.name || '')).toLowerCase().includes('fish') ||
                                   ((dish.category || '') + (dish.name || '')).toLowerCase().includes('egg') ||
                                   ((dish.category || '') + (dish.name || '')).toLowerCase().includes('non-veg');

                  return (
                    <div
                      key={dish.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        qtyInCart > 0
                          ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                      }`}
                    >
                      <div>
                        {/* Top Row: Veg Indicator + Category + Bestseller */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                              isNonVeg ? 'border-rose-500' : 'border-emerald-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isNonVeg ? 'bg-rose-500' : 'bg-emerald-600'}`} />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {dish.category}
                            </span>
                          </div>

                          {dish.isBestseller && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              ⭐ Bestseller
                            </span>
                          )}
                        </div>

                        {/* Dish Name */}
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                          {dish.name}
                        </h4>

                        {/* Description (if present) */}
                        {dish.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Bottom Row: Price & Quantity Controls */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                        <span className="text-sm font-black text-slate-900">
                          {currencySymbol}{parseFloat(dish.price).toFixed(2)}
                        </span>

                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-amber-300 shadow-xs">
                            <button
                              type="button"
                              onClick={() => removeFromCart(dish.id)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black px-2 text-slate-900">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(dish)}
                              className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(dish)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT COLUMN: DEDICATED LIVE TABLE ORDER & BILLING PANEL (5 Cols) ── */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between flex-1">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Table {currentTableNum} Order</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isOccupied ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isOccupied ? 'Active' : 'New Ticket'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {activeOrder 
                      ? `Appending to existing Order #${activeOrder.id.slice(-6).toUpperCase()}`
                      : 'Add items from the menu to send order to kitchen'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear New Items
                    </button>
                  )}
                  {activeOrder && (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Cancel mistakenly created order and free table"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove Order</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Existing Active Order Items (Already Placed) */}
              {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
                <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                    <span className="font-black text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                      <span>Already Placed In Kitchen ({activeOrder.items.length})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                        {activeOrder.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/90 text-xs shadow-2xs hover:border-slate-300 transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <h5 className="font-bold text-slate-900 truncate">{item.name}</h5>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {currencySymbol}{parseFloat(item.price).toFixed(2)} each
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={updatingPlacedItem}
                              onClick={() => handleUpdatePlacedItemQuantity(idx, -1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer shadow-2xs disabled:opacity-50"
                              title="Decrease quantity or remove"
                            >
                              −
                            </button>
                            <span className="text-xs font-black px-1.5 text-slate-900 min-w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={updatingPlacedItem}
                              onClick={() => handleUpdatePlacedItemQuantity(idx, 1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer shadow-2xs disabled:opacity-50"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-black text-slate-900 w-16 text-right font-mono text-xs">
                            {currencySymbol}{((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            disabled={updatingPlacedItem}
                            onClick={() => handleRemovePlacedItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Remove this dish from table order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-xs font-bold text-slate-600">
                    <span>Placed Items Subtotal:</span>
                    <span className="text-slate-900 font-black">{currencySymbol}{activeOrderSubtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 2. New Items to Append / Current Cart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                    {activeOrder ? `New Items to Append (${cart.length})` : `Order Cart Items (${cart.length})`}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {cart.reduce((s, i) => s + i.quantity, 0)} total pcs
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    <UtensilsCrossed className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                    <span>Click "+ Add" on any menu dish on the left to add items to this table.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <h5 className="font-bold text-slate-900 truncate">{item.name}</h5>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {currencySymbol}{item.price.toFixed(2)} each
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="w-5 h-5 rounded bg-slate-50 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-xs font-black px-1.5 text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="w-5 h-5 rounded bg-slate-50 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-black text-slate-900 w-16 text-right font-mono">
                            {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteFromCart(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kitchen Notes */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Kitchen Notes / Special Requests
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, serve piping hot, separate gravies..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-amber-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* ── BILLING BREAKDOWN & ACTION BUTTONS ── */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              {/* Financial Subtotals */}
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                {activeOrderSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span>Existing Placed Items:</span>
                    <span className="font-bold text-slate-800">{currencySymbol}{activeOrderSubtotal.toFixed(2)}</span>
                  </div>
                )}
                {cartSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span>Newly Added Items:</span>
                    <span className="font-bold text-amber-700">+{currencySymbol}{cartSubtotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Combined Subtotal:</span>
                  <span className="font-bold text-slate-900">{currencySymbol}{totalOrderSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax / GST ({taxRate}%):</span>
                  <span className="font-bold text-slate-900">{currencySymbol}{totalOrderTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span className="uppercase tracking-wider">Total Bill Amount:</span>
                  <span className="text-amber-800 font-mono">{currencySymbol}{totalPayable.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons Matrix */}
              <div className="space-y-2 pt-2">
                {/* 1. Primary Save / Send to Kitchen Button */}
                {cart.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitOrder('PREPARING')}
                      className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <span>Processing...</span>
                      ) : activeOrder ? (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Append & Send to Kitchen</span>
                        </>
                      ) : (
                        <>
                          <UtensilsCrossed className="w-4 h-4" />
                          <span>Send Order to Preparation</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitOrder('PLACED')}
                      className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Save as Pending without triggering preparation"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Order</span>
                    </button>
                  </div>
                )}

                {/* 2. Secondary Row: Settle Bill, Cancel Order & Print KOT */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {activeOrder && (
                    <button
                      type="button"
                      onClick={() => setShowBillModal(true)}
                      className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Generate Bill & Settle</span>
                    </button>
                  )}

                  {activeOrder && (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="Cancel mistakenly created order and free table"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Cancel Order</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePrintKOT}
                    className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="Print Kitchen Order Ticket"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print KOT</span>
                  </button>

                  {isOccupied && !activeOrder && (
                    <button
                      type="button"
                      onClick={() => handleUpdateTableStatus('AVAILABLE')}
                      className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Free Table
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── CANCEL / REMOVE MISTAKEN ORDER CONFIRMATION MODAL ── */}
      {showCancelModal && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Cancel Table {currentTableNum} Order?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Order #{activeOrder.id.slice(-6).toUpperCase()} ({activeOrder.items?.length || 0} items)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              If this order was placed mistakenly, canceling it will void the order and release 
              <span className="font-bold text-slate-900"> Table {currentTableNum} </span> 
              back to Available status immediately.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={cancellingOrder}
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                No, Keep Order
              </button>
              <button
                type="button"
                disabled={cancellingOrder}
                onClick={handleCancelActiveOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                {cancellingOrder ? (
                  <span>Cancelling...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Cancel Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BILL MODAL FOR PRINTING & SETTLEMENT ── */}
      {showBillModal && activeOrder && (
        <BillModal
          order={activeOrder}
          tableNumber={currentTableNum}
          hotelName={hotelDisplayName}
          currencySymbol={currencySymbol}
          taxPercentage={taxRate}
          contactPhone={hotelProfile?.contact_phone || ''}
          contactEmail={hotelProfile?.contact_email || ''}
          onClose={() => setShowBillModal(false)}
          onSettle={handleSettleBill}
        />
      )}
    </div>
  );
}
