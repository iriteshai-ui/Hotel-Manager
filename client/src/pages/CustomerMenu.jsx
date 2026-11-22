import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../SocketContext';
import NavBar from '../components/NavBar';
import BillModal from '../components/BillModal';

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const hotelSlug = searchParams.get('hotel');
  const tableId = searchParams.get('table') || 't1';
  const tableNumber = tableId.replace('t', '');
  
  const { menuItems: defaultMenuItems, placeOrder, isConnected } = useSocket();
  const [hotel, setHotel] = useState(null);
  const [hotelItems, setHotelItems] = useState([]);
  const [hotelLoading, setHotelLoading] = useState(!!hotelSlug);
  const [hotelError, setHotelError] = useState(null);

  const [cart, setCart] = useState([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [billOrder, setBillOrder] = useState(null);

  // Fetch hotel branding & tenant-isolated menu items
  useEffect(() => {
    if (!hotelSlug) {
      setHotel(null);
      setHotelItems([]);
      setHotelLoading(false);
      document.title = `Table ${tableNumber} - Menu`;
      return;
    }

    let isMounted = true;
    setHotelLoading(true);
    setHotelError(null);

    fetch(`/api/hotels/${encodeURIComponent(hotelSlug)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Hotel not found' : 'Failed to load hotel profile');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.hotel) {
          setHotel(data.hotel);
          setHotelItems(data.menuItems || []);
          document.title = `${data.hotel.name} - Table ${tableNumber}`;
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load hotel details:', err.message);
        setHotelError(err.message);
      })
      .finally(() => {
        if (isMounted) setHotelLoading(false);
      });

    return () => {
      isMounted = false;
      document.title = 'AURA Dining';
    };
  }, [hotelSlug, tableNumber]);

  // Currency Formatter
  const getCurrencySymbol = (curr) => {
    switch ((curr || '').toUpperCase()) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD':
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(hotel?.currency || 'USD');
  const primaryColor = hotel?.theme?.primaryColor || '#D97706';
  const customRadius = hotel?.theme?.borderRadius || '16px';

  // Active items source: if hotelSlug is provided, use hotelItems; otherwise defaultMenuItems
  const activeItems = useMemo(() => {
    return hotelSlug ? hotelItems : defaultMenuItems;
  }, [hotelSlug, hotelItems, defaultMenuItems]);

  // Pinned Quick-Add / Bestseller items
  const bestsellerItems = useMemo(() => {
    return activeItems.filter(item => item.isBestseller === true);
  }, [activeItems]);

  const categories = useMemo(() => {
    return ['All', ...new Set(activeItems.map(item => item.category).filter(Boolean))];
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeItems.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeItems, activeCategory, searchQuery]);

  const cartQtyMap = useMemo(() => {
    const map = {};
    for (const item of cart) {
      map[item.id] = item.quantity;
    }
    return map;
  }, [cart]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.reduce((acc, i) => {
      if (i.id === itemId) {
        if (i.quantity > 1) acc.push({ ...i, quantity: i.quantity - 1 });
      } else {
        acc.push(i);
      }
      return acc;
    }, []));
  };

  const getItemQuantity = (itemId) => cartQtyMap[itemId] || 0;

  const subtotal = cart.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);
  const taxRate = parseFloat(hotel?.taxPercentage ?? 10);
  const taxAmount = (subtotal * taxRate) / 100;
  const cartTotal = subtotal + taxAmount;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const orderItems = cart.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    const fakeOrder = { items: orderItems, timestamp: new Date().toISOString() };
    placeOrder(tableId, orderItems, hotel?.id || null);
    setCart([]);
    setShowOrderSummary(false);
    setOrderPlaced(true);
    setBillOrder(fakeOrder);
    setTimeout(() => setOrderPlaced(false), 5000);
  };

  // Check if item is non-veg or veg
  const isItemNonVeg = (item) => {
    const tags = Array.isArray(item.dietaryTags) ? item.dietaryTags.map(t => t.toLowerCase()) : [];
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return tags.includes('non-veg') || tags.includes('chicken') || tags.includes('mutton') || tags.includes('egg') ||
           cat.includes('non-veg') || cat.includes('non / veg') || name.includes('chicken') || name.includes('mutton') || name.includes('anda');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 transition-colors duration-200">
      <NavBar 
        hotel={hotel}
        title={`TABLE ${tableNumber}`} 
        statusBadge={
          <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">
              {hotel ? hotel.name : 'Table Active'}
            </span>
          </div>
        }
      />

      {/* Clean, Welcoming Restaurant Header */}
      <section className="bg-white border-b border-slate-200/80 px-6 py-8 text-center shadow-xs">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
            <span>🍽️</span> Table {tableNumber} · Dining Menu
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
            {hotel ? hotel.name : 'Restaurant Menu'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
            Browse authentic dishes, customize your meal, and send your order directly to the kitchen.
          </p>
          {hotel?.contactPhone && (
            <p className="text-xs text-slate-400 font-semibold mt-2">
              Restaurant Service Desk: <span className="text-slate-700 font-mono font-bold">{hotel.contactPhone}</span>
            </p>
          )}
        </div>
      </section>

      {/* Sticky Top Bar: Search & Category Navigation */}
      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          {/* Search Box */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by dish name (e.g. Chicken Handi, Kolhapuri, Naan, Paneer, Rice)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-xs"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-700 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => {
              const count = cat === 'All' 
                ? activeItems.length 
                : activeItems.filter(i => i.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat} <span className="opacity-70 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Recommendations Carousel (Clean Curated Row - Up to 6 items) */}
      {bestsellerItems.length > 0 && activeCategory === 'All' && !searchQuery && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-base font-black">⭐</span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                Popular Recommendations & Chef Picks
              </h2>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {bestsellerItems.length} Best Sellers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bestsellerItems.slice(0, 6).map(item => {
              const qty = getItemQuantity(item.id);
              const nonVeg = isItemNonVeg(item);

              return (
                <div 
                  key={`rec-${item.id}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs hover:shadow-md hover:border-amber-400 transition-all"
                >
                  <div className="flex-1 pr-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                        nonVeg ? 'border-rose-500' : 'border-emerald-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${nonVeg ? 'bg-rose-500' : 'bg-emerald-600'}`} />
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-700">
                        {currencySymbol}{parseFloat(item.price).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {qty > 0 ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl p-1">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-7 h-7 rounded-lg bg-white hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center cursor-pointer shadow-xs border border-amber-200"
                        >
                          −
                        </button>
                        <span className="text-xs font-black px-1.5 text-amber-900">{qty}</span>
                        <button 
                          onClick={() => addToCart(item)} 
                          className="w-7 h-7 rounded-lg bg-white hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center cursor-pointer shadow-xs border border-amber-200"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Dishes Grid */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
            {activeCategory === 'All' ? 'Complete Menu' : `${activeCategory}`} ({filteredItems.length} Dishes)
          </h3>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl bg-white border border-slate-200 shadow-xs max-w-lg mx-auto">
            <span className="text-4xl block mb-2 opacity-50">🔍</span>
            <h4 className="text-base font-bold text-slate-800 mb-1">No dishes match "{searchQuery}"</h4>
            <p className="text-xs text-slate-500 mb-4">Try clearing your search or choosing another category.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const qty = getItemQuantity(item.id);
              const nonVeg = isItemNonVeg(item);

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Veg/Non-Veg + Name + Price */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Veg / Non-Veg Indicator */}
                        <span className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 ${
                          nonVeg ? 'border-rose-500' : 'border-emerald-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${nonVeg ? 'bg-rose-500' : 'bg-emerald-600'}`} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {item.name}
                            </h4>
                            {item.isBestseller && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                ⭐ Popular
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              {item.category}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              nonVeg ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
                            }`}>
                              {nonVeg ? 'Non-Veg' : 'Pure Veg'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-base font-black text-amber-700 shrink-0">
                        {currencySymbol}{parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 my-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action: Quantity Control */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-2">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {qty > 0 ? `${qty} in your order` : 'Ready to prepare'}
                    </span>

                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-1">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-7 h-7 rounded-lg bg-white hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center cursor-pointer shadow-xs border border-amber-200"
                        >
                          −
                        </button>
                        <span className="text-xs font-black px-2 text-amber-900">{qty}</span>
                        <button 
                          onClick={() => addToCart(item)} 
                          className="w-7 h-7 rounded-lg bg-white hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center cursor-pointer shadow-xs border border-amber-200"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Add to Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <button 
            onClick={() => setShowOrderSummary(true)}
            className="w-full flex items-center justify-between p-3.5 px-6 rounded-2xl bg-slate-900 text-white shadow-2xl hover:bg-slate-800 transition-all cursor-pointer border border-slate-700"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Order</span>
                <span className="text-xs font-bold text-white">{cart.length} {cart.length === 1 ? 'Dish' : 'Dishes'} Selected</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Due</span>
                <span className="text-sm font-black text-amber-400">{currencySymbol}{cartTotal.toFixed(2)}</span>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-black flex items-center gap-1">
                View Bill →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Order Summary Modal / Drawer */}
      {showOrderSummary && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowOrderSummary(false)}>
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900">{hotel ? hotel.name : 'Table Order'}</h3>
                <p className="text-xs text-slate-500 font-medium">Table {tableNumber} · Guest Order Summary</p>
              </div>
              <button onClick={() => setShowOrderSummary(false)} className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 text-xs font-black cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex-1 pr-3 truncate">
                    <h5 className="font-bold text-slate-900 text-sm truncate">{item.name}</h5>
                    <p className="text-xs font-black text-amber-700">
                      {currencySymbol}{parseFloat(item.price).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200 shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-900 text-xs font-bold cursor-pointer">−</button>
                    <span className="text-xs font-black w-5 text-center text-slate-900">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-900 text-xs font-bold cursor-pointer">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Tax / GST ({taxRate}%):</span>
                  <span className="font-bold text-slate-900">{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-black text-slate-900 uppercase tracking-wider">Total Bill Amount:</span>
                  <span className="text-lg font-black text-amber-700">
                    {currencySymbol}{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-amber-600/20"
              >
                Confirm & Send Order to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill & Receipt Modal */}
      {billOrder && (
        <BillModal 
          order={billOrder} 
          tableNumber={tableNumber}
          hotelName={hotel?.name || 'Hotel Lay Bhari'}
          currencySymbol={currencySymbol}
          taxPercentage={taxRate}
          contactPhone={hotel?.contactPhone || ''}
          contactEmail={hotel?.contactEmail || ''}
          onClose={() => setBillOrder(null)} 
        />
      )}
    </div>
  );
}
