import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import NavBar from '../components/NavBar';
import BillModal from '../components/BillModal';
import { Link, useNavigate } from 'react-router-dom';

export default function WaiterDashboard() {
  const { orders, updateOrderStatus, isConnected } = useSocket();
  const navigate = useNavigate();
  const [billOrder, setBillOrder] = useState(null);
  
  const readyOrders = orders.filter(o => o.status === 'READY');
  const servedOrders = orders.filter(o => o.status === 'SERVED').slice(-6).reverse();

  // Redirect if all orders are served (user request)
  React.useEffect(() => {
    // Only redirect if there were orders and now there are none
    // or if the user explicitly wants to go home when the list is empty.
    // The user said: "after serving all oders come to home page"
    if (readyOrders.length === 0 && orders.some(o => o.status === 'SERVED')) {
        const timer = setTimeout(() => {
            // Optional: only redirect if they actually served something recently
            // but the request is simple: "after serving all oders come to home page"
            // We'll give it a small delay so they see the last one vanish
            navigate('/');
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [readyOrders.length, navigate]);

  return (
    <div className="min-h-screen bg-charcoal text-cream pb-24">
      <NavBar title="SERVICE CONCIERGE" />
      
      <div className="max-w-[1400px] mx-auto px-6 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Service Hub</h1>
            <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-cream-dim">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'AURA LIVE' : 'OFFLINE'}
              </span>
              <span className="w-1 h-1 rounded-full bg-charcoal-border" />
              <span>{readyOrders.length} TABLE(S) AWAITING SERVICE</span>
            </div>
          </div>
        </div>
        
        {readyOrders.length === 0 ? (
          <div className="bg-charcoal-light/30 border border-charcoal-border rounded-[32px] p-24 text-center backdrop-blur-sm mb-16">
            <div className="text-7xl mb-6 opacity-30 grayscale">🥂</div>
            <h3 className="text-2xl font-black text-cream mb-2">Precision Service</h3>
            <p className="text-cream-muted max-w-sm mx-auto font-medium mb-10">
              No orders are currently awaiting service. 
              The floor is immaculate.
            </p>
            <Link to="/" className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] bg-charcoal-mid border border-charcoal-border hover:bg-brand-light hover:text-brand hover:border-brand-border transition-all duration-300 no-underline text-cream">
              Return Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20 animate-fade-in">
            {readyOrders.map(order => (
              <div key={order.id} className="relative group flex flex-col p-8 rounded-[28px] bg-charcoal-light border border-charcoal-border transition-all duration-500 hover:-translate-y-1 hover:bg-charcoal-mid hover:shadow-2xl hover:shadow-emerald-500/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-cream">T-{order.tableNumber}</h3>
                    <span className="text-[10px] font-black tracking-widest text-cream-dim uppercase mt-1">Ready</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl shadow-lg shadow-emerald-500/10">
                    🛎️
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                    {(!order.items || order.items.length === 0) ? (
                      <p className="text-cream-dim text-xs italic">No items specified</p>
                    ) : order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-cream-muted font-medium">
                        {item.quantity}× {item.name || 'Unknown Item'}
                      </p>
                    ))}
                  </div>

                <div className="flex gap-2">
                  <button 
                    className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
                    onClick={() => updateOrderStatus(order.id, 'SERVED')}
                  >
                    Deliver
                  </button>
                  <button
                    className="px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-charcoal-mid border border-charcoal-border text-cream-muted hover:bg-brand hover:text-white hover:border-brand transition-all cursor-pointer"
                    onClick={() => setBillOrder(order)}
                    title="Print Bill"
                  >
                    🧾
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RECENTLY SERVED */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-black tracking-[0.3em] uppercase text-cream-dim">Past Services</h2>
            <div className="h-px flex-1 bg-charcoal-border opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {servedOrders.map(order => (
               <div key={order.id} className="p-4 rounded-2xl bg-charcoal-light/40 border border-charcoal-border opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                 <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-black text-cream tracking-widest">TABLE {order.tableNumber}</h4>
                    <span className="text-[9px] font-black text-cream-dim tracking-[0.2em]">SERVED</span>
                 </div>
                 <div className="text-[9px] font-bold text-cream-dim opacity-40 italic">ID: #{order.id.slice(-4).toUpperCase()}</div>
               </div>
            ))}
          </div>
        </section>
      </div>

      {billOrder && (
        <BillModal
          order={billOrder}
          tableNumber={billOrder.tableNumber}
          onClose={() => setBillOrder(null)}
        />
      )}
    </div>
  );
}
