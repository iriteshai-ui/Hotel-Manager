import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import NavBar from '../components/NavBar';
import BillModal from '../components/BillModal';

export default function ManagerDashboard() {
  const [searchParams] = useSearchParams();
  const hotelParam = searchParams.get('hotel');

  const { tables, orders, isConnected, addTable, deleteTable, freeTable } = useSocket();
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeTab, setActiveTab] = useState(hotelParam ? 'hotel-menu' : 'hotel-menu');
  const [newTableNum, setNewTableNum] = useState('');
  const [tableMsg, setTableMsg] = useState(null);
  const [insights, setInsights] = useState(null);
  const [billOrder, setBillOrder] = useState(null);
  const [insightsDate, setInsightsDate] = useState(new Date().toISOString().split('T')[0]);

  // Hotel Owner Menu State
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelMenuItems, setHotelMenuItems] = useState([]);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [menuMsg, setMenuMsg] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Mains',
    price: '',
    description: '',
    isBestseller: false
  });

  // Fetch all onboarded hotels
  useEffect(() => {
    fetch('/api/hotels')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setHotels(data);
          const matched = hotelParam ? data.find(h => h.slug === hotelParam) : null;
          setSelectedHotel(matched || data[0]);
        }
      })
      .catch(err => console.error('Error fetching hotels:', err));
  }, [hotelParam]);

  // Fetch menu items for currently selected hotel
  const fetchHotelMenu = async (slug) => {
    if (!slug) return;
    setHotelLoading(true);
    try {
      const res = await fetch(`/api/hotels/${encodeURIComponent(slug)}/menu`);
      const data = await res.json();
      setHotelMenuItems(data.items || []);
    } catch {
      setHotelMenuItems([]);
    } finally {
      setHotelLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHotel?.slug) {
      fetchHotelMenu(selectedHotel.slug);
    }
  }, [selectedHotel]);

  const handleShowQR = (table) => setSelectedTable(table);
  const closeModal = () => setSelectedTable(null);

  // Dynamic QR Url embedding hotel slug
  const getQRUrl = (tableId) => {
    if (selectedHotel?.slug) {
      return `${window.location.origin}/menu?hotel=${selectedHotel.slug}&table=${tableId}`;
    }
    return `${window.location.origin}/menu?table=${tableId}`;
  };

  const getCurrencySymbol = (code) => {
    switch ((code || '').toUpperCase()) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD':
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(selectedHotel?.currency);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/insights/daily?date=${insightsDate}`, {
        headers: { 'X-Auth-Token': token }
      });
      const data = await res.json();
      setInsights(data);
    } catch { setInsights(null); }
  };

  useEffect(() => {
    if (activeTab === 'insights') fetchInsights();
  }, [activeTab, insightsDate]);

  // Add Item to Hotel Menu
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!selectedHotel?.slug) return;
    if (!newItem.name.trim()) {
      setMenuMsg({ type: 'error', text: 'Item name is required.' });
      return;
    }
    const priceNum = parseFloat(newItem.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setMenuMsg({ type: 'error', text: 'Valid positive price is required.' });
      return;
    }

    try {
      const res = await fetch(`/api/hotels/${selectedHotel.slug}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name.trim(),
          category: newItem.category,
          price: priceNum,
          description: newItem.description.trim(),
          isBestseller: newItem.isBestseller
        })
      });
      if (res.ok) {
        const added = await res.json();
        setHotelMenuItems(prev => [added, ...prev]);
        setMenuMsg({ type: 'success', text: `"${added.name}" added to menu!` });
        setNewItem({
          name: '',
          category: 'Mains',
          price: '',
          description: '',
          isBestseller: false
        });
      } else {
        const err = await res.json();
        setMenuMsg({ type: 'error', text: err.error || 'Failed to add item.' });
      }
    } catch {
      setMenuMsg({ type: 'error', text: 'Network error adding menu item.' });
    }
    setTimeout(() => setMenuMsg(null), 3500);
  };

  // Toggle Bestseller Pin
  const handleToggleBestseller = async (itemId) => {
    if (!selectedHotel?.slug) return;
    try {
      const res = await fetch(`/api/hotels/${selectedHotel.slug}/menu/${itemId}/bestseller`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const updated = await res.json();
        setHotelMenuItems(prev => prev.map(i => i.id === itemId ? updated : i));
        setMenuMsg({
          type: 'success',
          text: updated.isBestseller 
            ? `⭐ "${updated.name}" pinned to Quick-Add Bestsellers!` 
            : `"${updated.name}" unpinned from Bestsellers.`
        });
      }
    } catch {
      setMenuMsg({ type: 'error', text: 'Failed to toggle bestseller status.' });
    }
    setTimeout(() => setMenuMsg(null), 3000);
  };

  // Delete Hotel Menu Item
  const handleDeleteMenuItem = async (itemId, name) => {
    if (!window.confirm(`Delete "${name}" from ${selectedHotel?.name} menu?`)) return;
    try {
      const res = await fetch(`/api/hotels/${selectedHotel.slug}/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setHotelMenuItems(prev => prev.filter(i => i.id !== itemId));
        setMenuMsg({ type: 'success', text: `"${name}" removed from menu.` });
      }
    } catch {
      setMenuMsg({ type: 'error', text: 'Failed to delete item.' });
    }
    setTimeout(() => setMenuMsg(null), 3000);
  };

  const handleAddTable = async () => {
    const num = parseInt(newTableNum, 10);
    if (!num || num < 1) { setTableMsg({ type: 'error', text: 'Enter a valid table number.' }); return; }
    const res = await addTable(num);
    if (res.ok) {
      setTableMsg({ type: 'success', text: `Table ${num} added.` });
      setNewTableNum('');
    } else {
      const err = await res.json();
      setTableMsg({ type: 'error', text: err.error || 'Failed to add table.' });
    }
    setTimeout(() => setTableMsg(null), 3000);
  };

  const handleFreeTable = async (number) => {
    await freeTable(number);
    setTableMsg({ type: 'success', text: `Table ${number} freed.` });
    setTimeout(() => setTableMsg(null), 3000);
  };

  const handleDeleteTable = async (number) => {
    if (!window.confirm(`Delete Table ${number}?`)) return;
    await deleteTable(number);
    setTableMsg({ type: 'success', text: `Table ${number} deleted.` });
    setTimeout(() => setTableMsg(null), 3000);
  };

  const getOrderForTable = (table) => {
    if (!table.currentOrderId) return null;
    return orders.find(o => o.id === table.currentOrderId);
  };

  const tabs = [
    { id: 'hotel-menu', label: 'Hotel Menu & Bestsellers' },
    { id: 'tables', label: 'QR Codes' },
    { id: 'manage', label: 'Manage Tables' },
    { id: 'insights', label: 'Daily Insights' },
  ];

  return (
    <div className="min-h-screen bg-charcoal text-cream pb-24">
      <NavBar title="MANAGEMENT CORE" statusBadge={
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          {isConnected ? 'NODE ACTIVE' : 'RECONNECTING'}
        </span>
      } />
      
      <div className="max-w-[1400px] mx-auto px-6 mt-12">
        <div className="mb-8 text-cream">
          <h1 className="text-4xl font-black tracking-tighter mb-2">Floor Overview</h1>
          <p className="text-cream-dim text-xs font-bold tracking-widest uppercase opacity-60">Real-time table management and analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 border-b border-charcoal-border pb-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all cursor-pointer border-b-2 ${activeTab === tab.id ? 'text-brand border-brand bg-brand/5' : 'text-cream-dim border-transparent hover:text-cream'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Hotel Menu & Bestsellers ── */}
        {activeTab === 'hotel-menu' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hotel Property Selector Header */}
            <div className="p-6 rounded-3xl bg-charcoal-light border border-charcoal-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg"
                  style={{ backgroundColor: selectedHotel?.theme?.primaryColor || '#D97706' }}
                >
                  {selectedHotel?.name ? selectedHotel.name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-cream">{selectedHotel?.name || 'Select Hotel'}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand font-mono font-bold">
                      {selectedHotel?.currency || 'USD'} ({currencySymbol})
                    </span>
                  </div>
                  <p className="text-xs text-cream-dim mt-0.5">
                    Tenant ID: <span className="font-mono">{selectedHotel?.id ? `${selectedHotel.id.slice(0, 13)}...` : 'N/A'}</span> • Tax: {selectedHotel?.taxPercentage || 10}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hotels.length > 1 && (
                  <select
                    value={selectedHotel?.slug || ''}
                    onChange={(e) => {
                      const h = hotels.find(item => item.slug === e.target.value);
                      if (h) setSelectedHotel(h);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-cream text-xs font-bold focus:outline-none focus:border-brand"
                  >
                    {hotels.map(h => (
                      <option key={h.id} value={h.slug}>{h.name} ({h.slug})</option>
                    ))}
                  </select>
                )}

                {selectedHotel && (
                  <a
                    href={`/menu?hotel=${selectedHotel.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-brand/20 transition-all flex items-center gap-1.5 no-underline"
                  >
                    <span>View Branded Menu</span> ↗
                  </a>
                )}
              </div>
            </div>

            {/* Menu Alert / Message */}
            {menuMsg && (
              <div className={`p-4 rounded-2xl text-xs font-bold border animate-fade-in flex items-center gap-2 ${
                menuMsg.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <span>{menuMsg.type === 'error' ? '⚠️' : '✓'}</span>
                <span>{menuMsg.text}</span>
              </div>
            )}

            {/* Main Menu Management Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Add Dish Form */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-charcoal-light border border-charcoal-border space-y-4">
                <div className="border-b border-charcoal-border pb-3">
                  <h3 className="text-lg font-black text-cream">Add New Menu Item</h3>
                  <p className="text-xs text-cream-dim">Add dish for {selectedHotel?.name || 'hotel'}</p>
                </div>

                <form onSubmit={handleAddMenuItem} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Truffle Fettuccine"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-cream text-sm focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                        Category
                      </label>
                      <select
                        value={newItem.category}
                        onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-cream text-xs font-bold focus:outline-none focus:border-brand"
                      >
                        <option value="Starters">Starters</option>
                        <option value="Mains">Mains</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Sides">Sides</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                        Price ({currencySymbol}) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newItem.price}
                        onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="24.00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-cream text-sm font-semibold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cream-muted mb-1">
                      Description (Ingredients / Notes)
                    </label>
                    <textarea
                      rows={2}
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Fresh handmade pasta, black truffle paste, parmesan emulsion..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-cream text-xs focus:outline-none focus:border-brand resize-none"
                    />
                  </div>

                  {/* Bestseller Pin Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal border border-amber-500/30">
                    <div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <span>⭐</span> Pin as Bestseller / Quick-Add
                      </span>
                      <span className="text-[10px] text-cream-dim block">Shown at the top of guest menu</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewItem(prev => ({ ...prev, isBestseller: !prev.isBestseller }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        newItem.isBestseller ? 'bg-amber-500' : 'bg-charcoal-border'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        newItem.isBestseller ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-brand/20 transition-all cursor-pointer"
                  >
                    + Add Dish to {selectedHotel?.name || 'Hotel'} Menu
                  </button>
                </form>
              </div>

              {/* Right: Menu Items List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-cream">Property Menu Items</h3>
                    <p className="text-xs text-cream-dim">
                      {hotelMenuItems.length} dishes registered • {hotelMenuItems.filter(i => i.isBestseller).length} pinned bestsellers
                    </p>
                  </div>
                  <button
                    onClick={() => selectedHotel?.slug && fetchHotelMenu(selectedHotel.slug)}
                    className="text-xs text-brand hover:underline font-bold"
                  >
                    Refresh
                  </button>
                </div>

                {hotelLoading ? (
                  <div className="p-12 text-center text-xs font-bold text-cream-dim">
                    Loading menu items...
                  </div>
                ) : hotelMenuItems.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-charcoal-light border border-charcoal-border text-center">
                    <span className="text-3xl block mb-2">🍽️</span>
                    <h4 className="text-base font-bold text-cream mb-1">No Menu Items Yet</h4>
                    <p className="text-xs text-cream-dim max-w-sm mx-auto">
                      Add dishes using the form on the left to start building this property's menu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hotelMenuItems.map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-charcoal-light border border-charcoal-border hover:border-charcoal-mid transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-charcoal-mid border border-charcoal-border text-brand">
                              {item.category}
                            </span>
                            <h4 className="text-sm font-bold text-cream">{item.name}</h4>
                            {item.isBestseller && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                ⭐ Bestseller
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-cream-muted line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-charcoal-border">
                          <span className="text-sm font-black text-cream">
                            {currencySymbol}{parseFloat(item.price).toFixed(2)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Toggle Bestseller Pin Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleBestseller(item.id)}
                              title={item.isBestseller ? 'Unpin from Bestsellers' : 'Pin to Quick-Add Bestsellers'}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                item.isBestseller
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                                  : 'bg-charcoal border-charcoal-border text-cream-dim hover:text-amber-400 hover:border-amber-500/30'
                              }`}
                            >
                              <span>⭐</span>
                              <span>{item.isBestseller ? 'Pinned' : 'Pin'}</span>
                            </button>

                            {/* Delete Item Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMenuItem(item.id, item.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-charcoal border border-charcoal-border text-cream-dim hover:text-rose-400 hover:border-rose-500/30 transition-all text-xs cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: QR Codes ── */}
        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map(table => (
              <div key={table.id} className="relative group p-8 rounded-[32px] bg-charcoal-light border border-charcoal-border transition-all duration-500 hover:-translate-y-1 hover:bg-charcoal-mid hover:shadow-2xl hover:shadow-brand/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-cream mb-1">{table.name || `Table ${table.number}`}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${table.status === 'OCCUPIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {table.status}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-charcoal-mid border border-charcoal-border flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">🪑</div>
                </div>
                <button onClick={() => handleShowQR(table)}
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-charcoal-mid border border-charcoal-border text-cream-muted hover:bg-brand hover:text-white hover:border-brand-hover transition-all cursor-pointer">
                  QR Code
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Manage Tables ── */}
        {activeTab === 'manage' && (
          <div>
            {tableMsg && (
              <div className={`mb-6 px-5 py-3 rounded-2xl text-sm font-bold border ${tableMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {tableMsg.text}
              </div>
            )}
            <div className="flex gap-3 mb-10">
              <input type="number" min="1" value={newTableNum} onChange={e => setNewTableNum(e.target.value)}
                placeholder="New table number"
                className="flex-1 px-4 py-3 rounded-xl bg-charcoal-mid border border-charcoal-border text-cream placeholder-cream-muted/40 focus:outline-none focus:border-brand text-sm font-medium" />
              <button onClick={handleAddTable}
                className="px-6 py-3 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-brand-hover transition-all cursor-pointer shadow-lg shadow-brand/20">
                Add Table
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tables.map(table => {
                const tOrder = getOrderForTable(table);
                return (
                  <div key={table.id} className="p-6 rounded-[28px] bg-charcoal-light border border-charcoal-border">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xl font-black text-cream">Table {table.number}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${table.status === 'OCCUPIED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {table.status}
                        </span>
                      </div>
                      <span className="text-2xl">🪑</span>
                    </div>
                    {tOrder && (
                      <button onClick={() => setBillOrder(tOrder)}
                        className="w-full mb-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-charcoal-mid border border-charcoal-border text-cream-muted hover:bg-brand hover:text-white hover:border-brand transition-all cursor-pointer">
                        🧾 Print Bill
                      </button>
                    )}
                    {table.status === 'OCCUPIED' && (
                      <button onClick={() => handleFreeTable(table.number)}
                        className="w-full mb-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white transition-all cursor-pointer">
                        Free Table
                      </button>
                    )}
                    <button onClick={() => handleDeleteTable(table.number)}
                      className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab: Insights ── */}
        {activeTab === 'insights' && (
          <div>
            <div className="flex gap-4 items-center mb-8">
              <input type="date" value={insightsDate} onChange={e => setInsightsDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-charcoal-mid border border-charcoal-border text-cream focus:outline-none focus:border-brand text-sm font-medium" />
              <button onClick={fetchInsights}
                className="px-5 py-2.5 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-brand-hover transition-all cursor-pointer">
                Load
              </button>
            </div>
            {insights ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                  {[
                    { label: 'Total Revenue', value: `₹${Number(insights.totalRevenue || 0).toFixed(2)}`, color: 'text-brand' },
                    { label: 'Total Orders', value: insights.totalOrders || 0, color: 'text-cream' },
                    { label: 'Completed', value: insights.completedOrders || 0, color: 'text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className="p-6 rounded-[24px] bg-charcoal-light border border-charcoal-border">
                      <p className="text-xs font-black uppercase tracking-widest text-cream-dim mb-2">{s.label}</p>
                      <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {insights.topItems?.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-cream-dim mb-5">Top Selling Items</h3>
                    <div className="space-y-3">
                      {insights.topItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-charcoal-light border border-charcoal-border">
                          <div className="flex items-center gap-3">
                            <span className="text-brand font-black text-sm">#{i + 1}</span>
                            <span className="text-cream font-bold">{item.name}</span>
                          </div>
                          <span className="text-cream-dim text-sm font-black">{item.count} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.orders?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-cream-dim mb-5">Order Log</h3>
                    <div className="space-y-3">
                      {insights.orders.slice(0, 20).map((order, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-charcoal-light border border-charcoal-border">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-cream-dim">T-{order.tableNumber}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{order.status}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-brand font-black text-sm">₹{Number(order.totalPrice).toFixed(2)}</span>
                            <button onClick={() => setBillOrder(order)} className="text-xs font-black text-cream-dim hover:text-brand cursor-pointer">🧾</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-cream-dim text-sm font-medium">Select a date and click Load to view insights.</p>
            )}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-xl flex justify-center items-center z-[1000] p-6 animate-fade-in" onClick={closeModal}>
          <div className="bg-charcoal-light border border-charcoal-border p-10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] max-w-[450px] w-full flex flex-col items-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand/5 blur-[80px] rounded-full -z-10" />
            <h2 className="text-3xl font-black mb-8 text-cream text-center tracking-tight">
              {selectedTable.name || `Table ${selectedTable.number}`}<br/>
              <span className="text-brand text-xs uppercase tracking-[0.3em] opacity-80">
                {selectedHotel ? `${selectedHotel.name} Menu Access` : 'Digital Menu Access'}
              </span>
            </h2>
            <div className="p-6 bg-white rounded-[32px] border-4 border-charcoal-border mb-10 shadow-inner group transition-transform hover:scale-[1.02]">
              <QRCodeSVG value={getQRUrl(selectedTable.id)} size={220} />
            </div>
            <div className="flex gap-4 w-full">
              <a href={getQRUrl(selectedTable.id)} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-brand text-white shadow-lg shadow-brand/20 hover:-translate-y-1 transition-all no-underline">
                Test Link
              </a>
              <button onClick={closeModal}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-charcoal-mid border border-charcoal-border text-cream-muted hover:bg-charcoal-border hover:text-cream transition-all cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {billOrder && (
        <BillModal order={billOrder} tableNumber={billOrder.tableNumber} onClose={() => setBillOrder(null)} />
      )}
    </div>
  );
}
