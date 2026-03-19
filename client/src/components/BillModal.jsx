import React from 'react';

export default function BillModal({ order, tableNumber, onClose }) {
  if (!order) return null;

  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;
  const billDate = order.timestamp ? new Date(order.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const lines = [
      `🍽️ *AURA Dining - Bill*`,
      `Table: ${tableNumber}`,
      `Date: ${billDate}`,
      `---`,
      ...items.map(i => `${i.quantity}x ${i.name} - ₹${(i.price * i.quantity).toFixed(2)}`),
      `---`,
      `Subtotal: ₹${subtotal.toFixed(2)}`,
      `GST (5%): ₹${gst.toFixed(2)}`,
      `*Total: ₹${total.toFixed(2)}*`,
      ``,
      `Thank you for dining with us! ✨`,
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#bill-print-area) { display: none !important; }
          #bill-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; background: white; color: black; padding: 24px; font-family: monospace; z-index: 9999; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-xl flex justify-center items-center z-[1000] p-4 no-print" onClick={onClose}>
        <div className="bg-charcoal-light border border-charcoal-border rounded-[32px] p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-cream tracking-tight">AURA Dining</h2>
            <p className="text-xs text-cream-muted font-bold uppercase tracking-widest mt-1">Table {tableNumber} · Bill</p>
            <p className="text-xs text-cream-dim mt-1 opacity-60">{billDate}</p>
          </div>

          <div className="border-t border-dashed border-charcoal-border py-4 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-cream-muted font-medium">
                <span>{item.quantity}× {item.name}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-charcoal-border pt-4 space-y-1">
            <div className="flex justify-between text-sm text-cream-muted">
              <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-cream-muted">
              <span>GST (5%)</span><span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-brand mt-2">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-cream-dim opacity-50 mt-4 font-medium">Thank you for dining with us ✨</p>

          <div className="mt-6 flex gap-3">
            <button onClick={handlePrint} className="flex-1 py-3 rounded-2xl bg-charcoal-mid border border-charcoal-border text-cream text-xs font-black uppercase tracking-widest hover:bg-brand hover:border-brand hover:text-white transition-all cursor-pointer">
              🖨️ Print
            </button>
            <button onClick={handleWhatsApp} className="flex-1 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">
              📱 WhatsApp
            </button>
          </div>
          <button onClick={onClose} className="w-full mt-3 py-3 rounded-2xl text-cream-dim text-xs font-bold hover:text-cream transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>

      <div id="bill-print-area" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center', fontSize: 20, marginBottom: 4 }}>AURA Dining</h2>
        <p style={{ textAlign: 'center', fontSize: 12 }}>Table {tableNumber} · {billDate}</p>
        <hr />
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' }}>
            <span>{item.quantity}x {item.name}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>GST (5%)</span><span>₹{gst.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold', marginTop: 8 }}><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
        <hr />
        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>Thank you for dining with us!</p>
      </div>
    </>
  );
}
