import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import NavBar from '../components/NavBar';

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS = {
  PLACED: {
    label: 'New Entry',
    borderCls: 'border-l-rose-500',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/20',
    dot: 'bg-rose-500',
    actionLabel: '👨‍🍳 Begin Prep',
    actionNext: 'PREPARING',
    actionCls: 'from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20',
  },
  PREPARING: {
    label: 'In Progress',
    borderCls: 'border-l-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/20',
    dot: 'bg-amber-500',
    actionLabel: '✨ Ready to Serve',
    actionNext: 'READY',
    actionCls: 'from-brand to-brand-hover shadow-lg shadow-brand/20',
  },
};

// ─── Single order card ────────────────────────────────────────────────────────
function OrderCard({ order, onUpdateStatus, updating }) {
  const cfg = STATUS[order.status];
  if (!cfg) return null;

  const elapsed = (() => {
    if (!order.timestamp) return null;
    const diff = Math.floor((Date.now() - new Date(order.timestamp)) / 60000);
    return diff < 1 ? 'Just now' : `${diff}m ago`;
  })();

  return (
    <div
      className={`
        relative flex flex-col overflow-hidden rounded-[24px] border border-charcoal-border
        bg-charcoal-light/50 backdrop-blur-sm p-6
        border-l-4 ${cfg.borderCls}
        transition-all duration-500
        hover:-translate-y-1 hover:bg-charcoal-mid
        hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
        group
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-cream">
            TABLE {order.tableNumber}
          </h3>
          <p className="text-cream-dim text-[10px] mt-1 font-black tracking-widest uppercase">
            ID: {order.id?.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`
              px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border
              ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} shadow-sm
            `}
          >
            {cfg.label}
          </span>
          {elapsed && (
            <span className="text-cream-dim text-[10px] font-bold italic opacity-60">
              {elapsed}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-3 mb-8">
        {(!order.items || order.items.length === 0) ? (
          <p className="text-cream-dim text-xs italic">No items specified</p>
        ) : order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center group/item">
            <span className="text-sm font-medium text-cream-muted group-hover/item:text-cream transition-colors">
              {item.quantity}× {item.name || 'Unknown Item'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-5 border-t border-charcoal-border/50">
        <button
          disabled={updating === order.id}
          onClick={() => onUpdateStatus(order.id, cfg.actionNext)}
          className={`
            w-full flex items-center justify-center gap-2
            py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white
            bg-gradient-to-r ${cfg.actionCls}
            transition-all duration-300 transform
            hover:-translate-y-0.5 active:scale-[0.98]
            disabled:opacity-40 disabled:grayscale
          `}
        >
          {updating === order.id ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            cfg.actionLabel
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function KitchenDisplay() {
  const { orders: allOrders, updateOrderStatus, isConnected } = useSocket();
  const [updating, setUpdating] = useState(null);

  const orders = allOrders.filter(
    (o) => o.status === 'PLACED' || o.status === 'PREPARING'
  ).sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    return a.status === 'PLACED' ? -1 : 1;
  });

  const handleUpdateStatus = (id, status) => {
    setUpdating(id);
    updateOrderStatus(id, status);
    setTimeout(() => setUpdating(null), 800); 
  };

  const placedCount = orders.filter((o) => o.status === 'PLACED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;

  return (
    <div className="min-h-screen bg-charcoal pb-24 text-cream">
      <NavBar title="KITCHEN OPERATION" />

      <div className="max-w-[1400px] mx-auto px-6 mt-12">
        
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-cream">Live Orders</h1>
            <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-cream-dim">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'AURA CLOUD ACTIVE' : 'RECONNECTING...'}
              </span>
              <span className="w-1 h-1 rounded-full bg-charcoal-border" />
              <span>{orders.length} ACTIVE REQUESTS</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-4 rounded-3xl bg-charcoal-light border border-charcoal-border flex flex-col items-center min-w-[140px]">
              <span className="text-3xl font-black text-rose-500">{placedCount}</span>
              <span className="text-[10px] font-black tracking-widest text-cream-dim uppercase mt-1">Pending</span>
            </div>
            <div className="px-6 py-4 rounded-3xl bg-charcoal-light border border-charcoal-border flex flex-col items-center min-w-[140px]">
              <span className="text-3xl font-black text-amber-500">{preparingCount}</span>
              <span className="text-[10px] font-black tracking-widest text-cream-dim uppercase mt-1">Preparing</span>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-8xl mb-8 opacity-20 grayscale">🍱</div>
            <h2 className="text-3xl font-black mb-3 text-cream">Kitchen is Clear</h2>
            <p className="text-cream-muted max-w-sm font-medium">
              No active culinary requests at this moment. 
              Orders will manifest here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-cream">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default KitchenDisplay;
