import React, { useState, useEffect } from 'react';
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
      document.title = `Table ${tableNumber} - AURA Dining`;
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
  const customRadius = hotel?.theme?.borderRadius || '24px';

  // Active items source: if hotelSlug is provided, use hotelItems; otherwise defaultMenuItems
  const activeItems = hotelSlug ? hotelItems : defaultMenuItems;

  // Pinned Quick-Add / Bestseller items
  const bestsellerItems = activeItems.filter(item => item.isBestseller === true);

  const categories = ['All', ...new Set(activeItems.map(item => item.category).filter(Boolean))];
  const filteredItems = activeItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
    placeOrder(tableId, orderItems);
    setCart([]);
    setShowOrderSummary(false);
    setOrderPlaced(true);
    setBillOrder(fakeOrder);
    setTimeout(() => setOrderPlaced(false), 5000);
  };

  return (
    <div 
      className="min-h-screen text-cream pb-32 transition-colors duration-300"
      style={{ backgroundColor: hotel?.theme?.backgroundColor || '#0B0F17' }}
    >
      <NavBar 
        hotel={hotel}
        title={`TABLE ${tableNumber}`} 
        statusBadge={
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span style={{ color: primaryColor }} className="text-[10px] font-black tracking-widest uppercase">
              {hotel ? `${hotel.name} Live` : 'Aura Sync'}
            </span>
          </div>
        }
      />

      {/* Hero Header with Dynamic Hotel Branding */}
      <section className="px-6 pt-16 pb-12 text-center relative overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 blur-[120px] rounded-full -z-10 opacity-30" 
          style={{ backgroundColor: primaryColor }}
        />
        
        {/* Hotel Property Pill */}
        {hotel && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4 animate-fade-in">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cream-dim">
              Verified Hotel Partner
            </span>
            <span className="text-white/30">•</span>
            <span className="text-[11px] font-bold text-cream-muted">
              Currency: {hotel.currency || 'USD'}
            </span>
          </div>
        )}

        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-cream uppercase">
          {hotel ? (
            <span>
              {hotel.name.split(' ').slice(0, -1).join(' ')}{' '}
              <span style={{ color: primaryColor }}>
                {hotel.name.split(' ').slice(-1)}
              </span>
            </span>
          ) : (
            <span>AURA <span style={{ color: primaryColor }}>DINING</span></span>
          )}
        </h1>

        <p className="text-cream-dim text-sm font-medium tracking-wide max-w-lg mx-auto opacity-80 leading-relaxed">
          {hotel 
            ? `Welcome to ${hotel.name}. Handcrafted culinary excellence prepared fresh for Table ${tableNumber}.`
            : 'Handcrafted delicacies prepared with celestial precision.'}
        </p>

        {hotel?.contactPhone && (
          <p className="text-xs text-cream-dim/60 mt-2 font-mono">
            Direct Concierge: {hotel.contactPhone} {hotel.contactEmail && `• ${hotel.contactEmail}`}
          </p>
        )}
      </section>

      {/* ⭐ Quick-Add / Bestseller Pin Section */}
      {bestsellerItems.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <div>
                <h2 className="text-lg font-black tracking-tight text-cream uppercase">
                  Bestsellers & Quick-Add
                </h2>
                <p className="text-xs text-cream-dim font-medium">
                  Guest favorites and popular picks pinned for instant reordering
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {bestsellerItems.length} Pinned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bestsellerItems.map(item => (
              <div 
                key={`bestseller-${item.id}`}
                className="relative flex items-center justify-between p-4 rounded-2xl bg-charcoal-light/80 border border-amber-500/30 hover:border-amber-500/70 transition-all shadow-lg shadow-amber-500/5 group"
                style={{ borderRadius: customRadius }}
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className="w-12 h-12 rounded-xl bg-charcoal-mid flex items-center justify-center text-xl flex-shrink-0 border border-charcoal-border">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      '⭐'
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-cream truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: primaryColor }}>
                      {currencySymbol}{parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  style={{ backgroundColor: primaryColor }}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <span>+ Quick Add</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search + Category Filter Bar */}
      <div className="sticky top-20 z-40 bg-charcoal/90 backdrop-blur-xl border-y border-charcoal-border mb-10">
        <div className="max-w-[1400px] mx-auto px-6 py-3">
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-dim opacity-50">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${hotel ? hotel.name : 'Aura'} dishes, ingredients...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-mid border border-charcoal-border text-cream placeholder-cream-muted/40 focus:outline-none focus:border-brand text-sm font-medium"
            />
          </div>
          <div className="overflow-x-auto no-scrollbar flex gap-2.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border cursor-pointer ${
                  activeCategory === cat 
                    ? 'text-white shadow-lg' 
                    : 'bg-charcoal-mid text-cream-muted border-charcoal-border hover:border-brand-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel Loading / Empty State */}
      {hotelLoading && (
        <div className="max-w-md mx-auto text-center py-20 px-6">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-cream-dim">Loading property menu...</p>
        </div>
      )}

      {hotelError && (
        <div className="max-w-md mx-auto text-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
          <h3 className="text-lg font-bold text-rose-400 mb-2">Property Not Found</h3>
          <p className="text-xs text-cream-dim leading-relaxed mb-6">
            We couldn't find a hotel property matching slug "{hotelSlug}". Check the URL or onboarding dashboard.
          </p>
        </div>
      )}

      {/* Menu Grid */}
      {!hotelLoading && !hotelError && (
        <main className="max-w-[1400px] mx-auto px-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 px-6 rounded-3xl bg-charcoal-light/40 border border-charcoal-border">
              <span className="text-4xl mb-3 block">🍽️</span>
              <h3 className="text-xl font-bold text-cream mb-2">No menu items found</h3>
              <p className="text-xs text-cream-dim max-w-sm mx-auto">
                {searchQuery 
                  ? `No items match "${searchQuery}". Try a different keyword.` 
                  : 'This property does not have any active menu items in this section.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  style={{ borderRadius: customRadius }}
                  className="group relative flex flex-col p-6 bg-charcoal-light border border-charcoal-border transition-all duration-500 hover:-translate-y-2 hover:bg-charcoal-mid hover:shadow-2xl hover:shadow-brand/5"
                >
                  {/* Bestseller Badge */}
                  {item.isBestseller && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 backdrop-blur-md">
                      <span>⭐</span> Bestseller
                    </div>
                  )}

                  <div className="relative mb-6 rounded-2xl overflow-hidden aspect-square flex items-center justify-center bg-charcoal-mid border border-charcoal-border shadow-inner group-hover:border-brand-border/30 transition-all">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      />
                    ) : null}
                    <span className={`text-6xl filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-700 ${item.imageUrl ? 'hidden' : 'block'}`}>🥘</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent pointer-events-none" />
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black tracking-tight group-hover:text-brand transition-colors text-cream pr-2">{item.name}</h3>
                    <span className="font-black text-lg tracking-tighter flex-shrink-0" style={{ color: primaryColor }}>
                      {currencySymbol}{parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>

                  {/* Dietary Badges */}
                  {Array.isArray(item.dietaryTags) && item.dietaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.dietaryTags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-cream-dim">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-cream-dim text-xs line-clamp-2 font-medium mb-6 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.description || `Handcrafted specialty prepared fresh for Table ${tableNumber}.`}
                  </p>

                  <button 
                    onClick={() => addToCart(item)}
                    style={{ borderColor: primaryColor }}
                    className="w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] bg-charcoal-mid border text-cream hover:bg-brand hover:text-white transition-all duration-300 transform active:scale-[0.98] cursor-pointer shadow-md"
                  >
                    + Add to Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Floating Cart Concierge */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-float-in">
          <button 
            onClick={() => setShowOrderSummary(true)}
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-6 px-9 py-4 rounded-full text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/20 hover:-translate-y-1 transition-all group scale-105 cursor-pointer"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black tracking-[0.3em] opacity-80 uppercase leading-none mb-1">Order</span>
              <span className="text-lg font-black tracking-tighter leading-none">{cart.length} Items</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black tracking-[0.3em] opacity-80 uppercase leading-none mb-1">Total (inc. tax)</span>
              <span className="text-lg font-black tracking-tighter leading-none">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              🛒
            </div>
          </button>
        </div>
      )}

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 z-[100] bg-charcoal/60 backdrop-blur-2xl flex justify-end animate-fade-in" onClick={() => setShowOrderSummary(false)}>
          <div className="w-full max-w-md bg-charcoal-light border-l border-charcoal-border h-full flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-charcoal-border flex justify-between items-center bg-charcoal/40">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-cream">{hotel ? hotel.name : 'Table Selection'}</h2>
                <p className="text-xs text-cream-dim font-bold uppercase tracking-widest mt-0.5">Table {tableNumber} • Guest Order</p>
              </div>
              <button onClick={() => setShowOrderSummary(false)} className="w-10 h-10 rounded-full bg-charcoal-mid flex items-center justify-center hover:bg-charcoal-border transition-colors text-cream cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center group bg-charcoal/30 p-3 rounded-2xl border border-charcoal-border/50">
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-12 h-12 rounded-xl bg-charcoal-mid border border-charcoal-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🍱</span>
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-cream tracking-tight truncate text-sm">{item.name}</h4>
                      <p className="text-xs font-black" style={{ color: primaryColor }}>{currencySymbol}{parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-charcoal-mid rounded-xl p-1 border border-charcoal-border flex-shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-lg hover:bg-charcoal/40 flex items-center justify-center text-white cursor-pointer">−</button>
                    <span className="text-xs font-black w-4 text-center text-cream">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-lg hover:bg-charcoal/40 flex items-center justify-center text-white cursor-pointer">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-charcoal-mid rounded-t-[40px] border-t border-charcoal-border shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-cream-dim">
                  <span>Subtotal</span>
                  <span className="font-bold text-cream">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cream-dim">
                  <span>Estimated Tax ({taxRate}%)</span>
                  <span className="font-bold text-cream">{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between items-center text-base">
                  <span className="font-black tracking-widest text-cream uppercase text-xs">Total Due</span>
                  <span className="text-3xl font-black tracking-tighter" style={{ color: primaryColor }}>
                    {currencySymbol}{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:brightness-110 transition-all active:scale-[0.98] cursor-pointer"
              >
                Send Order to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Placed Toast */}
      {orderPlaced && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in">
          <div className="px-10 py-5 rounded-3xl bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 border-2 border-emerald-400 flex items-center gap-4">
            <span className="text-2xl">✨</span>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest leading-none mb-1">Success</span>
              <span className="text-sm font-bold tracking-tight">Your order has been sent to the kitchen!</span>
            </div>
          </div>
        </div>
      )}

      {billOrder && (
        <BillModal
          order={billOrder}
          tableNumber={tableNumber}
          onClose={() => setBillOrder(null)}
        />
      )}
    </div>
  );
}
