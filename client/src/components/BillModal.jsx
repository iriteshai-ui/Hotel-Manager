import React from 'react';

export default function BillModal({ order, tableNumber, onClose, onSettle }) {
  if (!order) return null;

  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;
  const billDate = order.timestamp ? new Date(order.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const handlePrint = () => {
    const rows = items.map(i =>
      `<tr>
        <td style="padding:4px 8px">${i.quantity}× ${i.name}</td>
        <td style="padding:4px 8px;text-align:right">₹${(i.price * i.quantity).toFixed(2)}</td>
       </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill - Table ${tableNumber}</title>
  <style>
    body { font-family: monospace; max-width: 320px; margin: 24px auto; color: #000; }
    h2  { text-align: center; font-size: 20px; margin-bottom: 4px; }
    p   { text-align: center; font-size: 12px; margin: 2px 0; }
    hr  { border: none; border-top: 1px dashed #000; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .total td { font-size: 16px; font-weight: bold; padding-top: 8px; }
    .footer { text-align: center; font-size: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <h2>AURA Dining</h2>
  <p>Table ${tableNumber}</p>
  <p>${billDate}</p>
  <hr/>
  <table>
    <tbody>${rows}</tbody>
    <tbody>
      <tr><td colspan="2"><hr/></td></tr>
      <tr><td style="padding:4px 8px">Subtotal</td><td style="padding:4px 8px;text-align:right">₹${subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 8px">GST (5%)</td><td style="padding:4px 8px;text-align:right">₹${gst.toFixed(2)}</td></tr>
      <tr class="total"><td style="padding:4px 8px">TOTAL</td><td style="padding:4px 8px;text-align:right">₹${total.toFixed(2)}</td></tr>
    </tbody>
  </table>
  <hr/>
  <p class="footer">Thank you for dining with us!</p>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <>
      <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-xl flex justify-center items-center z-[1000] p-4" onClick={onClose}>
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

          <div className="mt-6 space-y-2">
            <button onClick={handlePrint} className="w-full py-3 rounded-2xl bg-brand border border-brand text-white text-xs font-black uppercase tracking-widest hover:bg-brand-hover transition-all cursor-pointer">
              🖨️ Print Bill
            </button>
            {onSettle && (
              <button
                onClick={onSettle}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                ✓ Settle Bill & Free Table
              </button>
            )}
          </div>
          <button onClick={onClose} className="w-full mt-3 py-3 rounded-2xl text-cream-dim text-xs font-bold hover:text-cream transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </>
  );
}
