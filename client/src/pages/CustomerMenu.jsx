import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../SocketContext';
import NavBar from '../components/NavBar';

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || 't1';
  const tableNumber = tableId.replace('t', '');
  
  const { menuItems, placeOrder, isConnected } = useSocket();
  const [cart, setCart] = useState([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

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

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    // Map cart items to the backend OrderItem model
    const orderItems = cart.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    placeOrder(tableId, orderItems);
    setCart([]);
    setShowOrderSummary(false);
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 5000);
  };

  return (
    <div className="min-h-screen bg-charcoal text-cream pb-32">
      <NavBar 
        title={`TABLE ${tableNumber}`} 
        statusBadge={
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-black tracking-widest text-brand uppercase">Aura Sync</span>
          </div>
        }
      />

      {/* Hero Header */}
      <section className="px-6 pt-16 pb-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-brand/5 blur-[100px] rounded-full -z-10" />
        <h1 className="text-5xl font-black tracking-tighter mb-4 text-cream uppercase">AURA <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover">DINING</span></h1>
        <p className="text-cream-dim text-sm font-medium tracking-wide max-w-xs mx-auto opacity-70">
          Handcrafted delicacies prepared with celestial precision.
        </p>
      </section>

      {/* Category Nav */}
      <div className="sticky top-20 z-40 bg-charcoal/80 backdrop-blur-xl border-y border-charcoal-border mb-12">
        <div className="max-w-[1400px] mx-auto px-6 overflow-x-auto no-scrollbar py-4 flex gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border cursor-pointer ${activeCategory === cat ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-charcoal-mid text-cream-muted border-charcoal-border hover:border-brand-border'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="group relative flex flex-col p-6 rounded-[32px] bg-charcoal-light border border-charcoal-border transition-all duration-500 hover:-translate-y-2 hover:bg-charcoal-mid hover:shadow-2xl hover:shadow-brand/5">
              <div className="relative mb-6 rounded-2xl overflow-hidden aspect-square flex items-center justify-center bg-charcoal-mid border border-charcoal-border shadow-inner group-hover:border-brand-border/30 transition-all">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  />
                ) : null}
                <span className={`text-6xl filter drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-700 ${item.image ? 'hidden' : 'block'}`}>🥘</span>
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent pointer-events-none" />
              </div>

              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-black tracking-tight group-hover:text-brand transition-colors text-cream">{item.name}</h3>
                <span className="text-brand font-black text-lg tracking-tighter">₹{item.price}</span>
              </div>
              <p className="text-cream-dim text-sm line-clamp-2 font-medium mb-8 flex-1 opacity-70 group-hover:opacity-100 transition-opacity italic">
                A masterpiece of flavor carefully curated for Table {tableNumber}.
              </p>

              <button 
                onClick={() => addToCart(item)}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-charcoal-mid border border-charcoal-border text-brand hover:bg-brand hover:text-white hover:border-brand-hover hover:shadow-xl hover:shadow-brand/20 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
              >
                Add to Selection
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Cart Concierge */}
      {cart.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-float-in">
          <button 
            onClick={() => setShowOrderSummary(true)}
            className="flex items-center gap-6 px-10 py-5 rounded-full bg-brand text-white shadow-[0_20px_60px_rgba(212,175,55,0.4)] border-2 border-brand-hover hover:-translate-y-1 transition-all group scale-105 cursor-pointer"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black tracking-[0.3em] opacity-80 uppercase leading-none mb-1">Selections</span>
              <span className="text-lg font-black tracking-tighter leading-none">{cart.length} Items</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black tracking-[0.3em] opacity-80 uppercase leading-none mb-1">Total</span>
              <span className="text-lg font-black tracking-tighter leading-none">₹{cartTotal}</span>
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
              <h2 className="text-2xl font-black tracking-tighter text-cream">My Selection</h2>
              <button onClick={() => setShowOrderSummary(false)} className="w-10 h-10 rounded-full bg-charcoal-mid flex items-center justify-center hover:bg-charcoal-border transition-colors text-cream cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-charcoal-mid border border-charcoal-border flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🍱</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-cream tracking-tight">{item.name}</h4>
                      <p className="text-xs text-brand font-black">₹{item.price} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-charcoal-mid rounded-xl p-1.5 border border-charcoal-border">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg hover:bg-charcoal/40 flex items-center justify-center text-white cursor-pointer">−</button>
                    <span className="text-xs font-black w-4 text-center text-cream">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg hover:bg-charcoal/40 flex items-center justify-center text-white cursor-pointer">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-charcoal-mid rounded-t-[40px] border-t border-charcoal-border shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-black tracking-widest text-cream-dim uppercase">Amount Due</span>
                <span className="text-3xl font-black text-brand tracking-tighter">₹{cartTotal}</span>
              </div>
              <button 
                onClick={handlePlaceOrder}
                className="w-full py-5 rounded-[24px] bg-brand text-white font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-brand/20 hover:-translate-y-1 hover:shadow-brand/40 transition-all active:scale-[0.98] cursor-pointer"
              >
                Confirm Luxury Order
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
              <span className="text-sm font-bold tracking-tight">Your order is being prepared!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
