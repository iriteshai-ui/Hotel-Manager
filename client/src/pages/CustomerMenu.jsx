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
    <div 
      className="min-h-screen text-cream pb-32 transition-colors duration-200"
      style={{ backgroundColor: hotel?.theme?.backgroundColor || '#0B0F17' }}
    >
      <NavBar 
        hotel={hotel}
        title={`TABLE ${tableNumber}`} 
        statusBadge={
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span style={{ color: primaryColor }} className="text-[10px] font-bold tracking-widest uppercase">
              {hotel ? `${hotel.name}` : 'Aura Live'}
            </span>
          </div>
        }
      />

      {/* Clean Restaurant Header */}
      <section className="px-6 pt-10 pb-6 text-center border-b border-charcoal-border/50 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-cream">
          {hotel ? hotel.name : 'Restaurant Menu'}
        </h1>
        <p className="text-cream-dim text-xs sm:text-sm font-medium tracking-wide">
          Table {tableNumber} • Select items below to place your order
        </p>

        {hotel?.contactPhone && (
          <p className="text-[11px] text-cream-dim/60 mt-2 font-mono">
            Direct Concierge: {hotel.contactPhone}
          </p>
        )}
      </section>

      {/* ⭐ Quick-Add / Bestseller Pin Section */}
      {bestsellerItems.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">⭐</span>
              <h2 className="text-sm font-bold tracking-wider uppercase text-cream">
                Bestsellers & Popular Picks
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {bestsellerItems.length} Items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {bestsellerItems.map(item => {
              const qty = getItemQuantity(item.id);
              const nonVeg = isItemNonVeg(item);

              return (
                <div 
                  key={`bestseller-${item.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-light border border-amber-500/20 hover:border-amber-500/50 transition-colors"
                  style={{ borderRadius: customRadius }}
                >
                  <div className="flex-1 pr-3 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                        nonVeg ? 'border-rose-500/80' : 'border-emerald-500/80'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${nonVeg ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-cream truncate block">{item.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: primaryColor }}>
                      {currencySymbol}{parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>

                  {qty > 0 ? (
                    <div className="flex items-center gap-1.5 bg-charcoal border border-charcoal-border rounded-lg p-1 flex-shrink-0">
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="w-6 h-6 rounded bg-charcoal-mid hover:bg-charcoal text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold px-1 text-cream">{qty}</span>
                      <button 
                        onClick={() => addToCart(item)} 
                        className="w-6 h-6 rounded bg-charcoal-mid hover:bg-charcoal text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      style={{ backgroundColor: primaryColor }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search + Category Filter Bar */}
      <div className="sticky top-20 z-40 bg-charcoal/95 backdrop-blur-md border-y border-charcoal-border mb-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5">
          <div className="relative mb-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search dishes, ingredients...`}
              className="w-full px-4 py-2 rounded-xl bg-charcoal-mid border border-charcoal-border text-cream placeholder-cream-muted/40 focus:outline-none focus:border-brand text-xs sm:text-sm"
            />
          </div>
          <div className="overflow-x-auto no-scrollbar flex gap-2 pb-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap border cursor-pointer ${
                  activeCategory === cat 
                    ? 'text-white' 
                    : 'bg-charcoal-mid text-cream-muted border-charcoal-border hover:text-white'
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
          <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-cream-dim">Loading menu...</p>
        </div>
      )}

      {hotelError && (
        <div className="max-w-md mx-auto text-center py-16 px-6">
          <h3 className="text-base font-bold text-rose-400 mb-1">Property Not Found</h3>
          <p className="text-xs text-cream-dim leading-relaxed">
            We couldn't find a hotel property matching slug "{hotelSlug}".
          </p>
        </div>
      )}

      {/* Clean Menu Grid (Text-First, High Readability) */}
      {!hotelLoading && !hotelError && (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-2xl bg-charcoal-light border border-charcoal-border">
              <h3 className="text-sm font-bold text-cream mb-1">No items match your search</h3>
              <p className="text-xs text-cream-dim">
                Try selecting another category or clear the search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map(item => {
                const qty = getItemQuantity(item.id);
                const nonVeg = isItemNonVeg(item);

                return (
                  <div 
                    key={item.id} 
                    style={{ borderRadius: customRadius }}
                    className="flex flex-col justify-between p-4 bg-charcoal-light border border-charcoal-border hover:border-charcoal-border/80 transition-colors"
                  >
                    <div>
                      {/* Top Header: Indicator + Name + Price */}
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="flex items-start gap-2 flex-1">
                          {/* Veg / Non-Veg Indicator */}
                          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            nonVeg ? 'border-rose-500/80' : 'border-emerald-500/80'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${nonVeg ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          </span>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-cream">{item.name}</h3>
                              {item.isBestseller && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  ⭐ Bestseller
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-cream-dim/60 uppercase">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <span className="font-black text-sm sm:text-base text-cream flex-shrink-0" style={{ color: primaryColor }}>
                          {currencySymbol}{parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-cream-dim text-xs line-clamp-2 font-normal mb-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Dietary Badges */}
                      {Array.isArray(item.dietaryTags) && item.dietaryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.dietaryTags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-charcoal border border-charcoal-border text-cream-dim">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Add Action */}
                    <div className="pt-2 border-t border-charcoal-border/40 flex justify-end items-center">
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-charcoal border border-charcoal-border rounded-lg p-1">
                          <button 
                            onClick={() => removeFromCart(item.id)} 
                            className="w-7 h-7 rounded bg-charcoal-mid hover:bg-charcoal text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold px-2 text-cream">{qty} in order</span>
                          <button 
                            onClick={() => addToCart(item)} 
                            className="w-7 h-7 rounded bg-charcoal-mid hover:bg-charcoal text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)}
                          className="px-4 py-1.5 rounded-lg font-bold text-xs bg-charcoal-mid border border-charcoal-border text-cream hover:bg-charcoal hover:border-cream/20 transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Floating Cart Concierge */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => setShowOrderSummary(true)}
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-4 px-6 py-3 rounded-full text-white shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-bold uppercase opacity-80">Order</span>
              <span className="text-sm font-bold">{cart.length} {cart.length === 1 ? 'Item' : 'Items'}</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] font-bold uppercase opacity-80">Total</span>
              <span className="text-sm font-bold">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full ml-1">
              View Order →
            </span>
          </button>
        </div>
      )}

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowOrderSummary(false)}>
          <div className="w-full max-w-md bg-charcoal border-l border-charcoal-border h-full flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-charcoal-border flex justify-between items-center bg-charcoal-light">
              <div>
                <h2 className="text-lg font-bold text-cream">{hotel ? hotel.name : 'Your Order'}</h2>
                <p className="text-xs text-cream-dim">Table {tableNumber} • Guest Order</p>
              </div>
              <button onClick={() => setShowOrderSummary(false)} className="w-8 h-8 rounded-lg bg-charcoal-mid flex items-center justify-center hover:bg-charcoal-border transition-colors text-cream cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-charcoal-light border border-charcoal-border">
                  <div className="flex-1 pr-3 truncate">
                    <h4 className="font-bold text-cream text-xs sm:text-sm truncate">{item.name}</h4>
                    <p className="text-xs font-bold" style={{ color: primaryColor }}>
                      {currencySymbol}{parseFloat(item.price).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-charcoal rounded-lg p-1 border border-charcoal-border flex-shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded hover:bg-charcoal-mid flex items-center justify-center text-white text-xs cursor-pointer">−</button>
                    <span className="text-xs font-bold w-4 text-center text-cream">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-6 h-6 rounded hover:bg-charcoal-mid flex items-center justify-center text-white text-xs cursor-pointer">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-charcoal-light border-t border-charcoal-border">
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between text-cream-dim">
                  <span>Subtotal</span>
                  <span className="font-bold text-cream">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cream-dim">
                  <span>Estimated Tax ({taxRate}%)</span>
                  <span className="font-bold text-cream">{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="h-px bg-charcoal-border my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-cream uppercase">Total Due</span>
                  <span className="text-xl font-bold" style={{ color: primaryColor }}>
                    {currencySymbol}{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-md"
              >
                Confirm & Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill & Receipt Modal */}
      {billOrder && (
        <BillModal 
          isOpen={!!billOrder} 
          order={billOrder} 
          onClose={() => setBillOrder(null)} 
        />
      )}
    </div>
  );
}
