import React from 'react';

export default function BillModal({ 
  order, 
  tableNumber, 
  onClose, 
  onSettle,
  hotelName = 'AURA Dining & Hotel',
  currencySymbol = '₹',
  taxPercentage = 5,
  contactPhone = '',
  contactEmail = ''
}) {
  if (!order) return null;

  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity, 10) || 1), 0);
  const taxRate = parseFloat(taxPercentage) || 5;
  const gst = (subtotal * taxRate) / 100;
  const total = subtotal + gst;
  const billDate = order.timestamp ? new Date(order.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const tNum = tableNumber || order.tableNumber;

  const handlePrint = () => {
    const totalPcs = items.reduce((s, i) => s + (parseInt(i.quantity, 10) || 1), 0);
    const rows = items.map(i => {
      const qty = parseInt(i.quantity, 10) || 1;
      const unitPrice = parseFloat(i.price) || 0;
      const itemTotal = unitPrice * qty;
      return `<tr style="border-bottom: 1px dotted #ccc;">
        <td style="padding:6px 4px; font-weight:bold; font-size:13px; text-align:center; vertical-align:top;">${qty}×</td>
        <td style="padding:6px 6px; font-size:13px; vertical-align:top;">
          <div style="font-weight:700; color:#111;">${i.name}</div>
          ${i.category ? `<div style="font-size:10px; color:#666; text-transform:uppercase; margin-top:1px;">${i.category}</div>` : ''}
        </td>
        <td style="padding:6px 6px; font-size:12px; text-align:right; font-family:'Courier New', monospace; color:#333; vertical-align:top;">${currencySymbol}${unitPrice.toFixed(2)}</td>
        <td style="padding:6px 4px; font-size:13px; text-align:right; font-family:'Courier New', monospace; font-weight:bold; color:#000; vertical-align:top;">${currencySymbol}${itemTotal.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill - ${hotelName} - Table ${tNum}</title>
  <style>
    @page { margin: 4mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 330px;
      margin: 12px auto;
      padding: 10px;
      color: #000;
      background: #fff;
    }
    .header { text-align: center; margin-bottom: 8px; }
    h2 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }
    .subtitle { margin: 2px 0 0 0; font-size: 11px; color: #555; }
    .doc-type { margin: 6px 0 2px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #333; }
    .badge {
      display: inline-block;
      font-size: 20px;
      font-weight: 900;
      background: #000;
      color: #fff;
      padding: 4px 14px;
      margin: 6px 0 4px 0;
      border-radius: 6px;
      letter-spacing: 1px;
    }
    .meta { font-size: 11px; color: #444; margin: 2px 0; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    th {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 4px;
      border-bottom: 1.5px solid #000;
      letter-spacing: 0.5px;
      color: #000;
    }
    .totals-box { margin-top: 4px; border-top: 1px dashed #000; padding-top: 6px; }
    .totals-row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; color: #333; }
    .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 6px 0;
      margin-top: 6px;
      font-size: 16px;
      font-weight: 900;
      color: #000;
    }
    .footer { text-align: center; font-size: 11px; color: #666; margin-top: 12px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${hotelName}</h2>
    ${contactPhone ? `<p class="subtitle">Tel: ${contactPhone}</p>` : ''}
    ${contactEmail ? `<p class="subtitle">Email: ${contactEmail}</p>` : ''}
    <div class="doc-type">Official Dining Tax Invoice</div>
    <div class="badge">TABLE ${tNum}</div>
    <p class="meta">
      ${order.id ? `Invoice #${order.id.slice(-6).toUpperCase()} · ` : ''}${billDate}
    </p>
  </div>

  <hr/>

  <table>
    <thead>
      <tr>
        <th style="width:14%; text-align:center;">QTY</th>
        <th style="width:48%; text-align:left;">ITEM</th>
        <th style="width:18%; text-align:right;">RATE</th>
        <th style="width:20%; text-align:right;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="totals-row">
      <span>Subtotal (${totalPcs} items)</span>
      <span style="font-family:'Courier New', monospace; font-weight:600;">${currencySymbol}${subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Tax / GST (${taxRate}%)</span>
      <span style="font-family:'Courier New', monospace; font-weight:600;">${currencySymbol}${gst.toFixed(2)}</span>
    </div>
    <div class="grand-total">
      <span style="letter-spacing:0.5px;">TOTAL DUE</span>
      <span style="font-family:'Courier New', monospace;">${currencySymbol}${total.toFixed(2)}</span>
    </div>
  </div>

  <hr/>
  <div class="footer">
    <p style="margin:0 0 2px 0; font-weight:bold; color:#333;">Thank you for dining at ${hotelName}!</p>
    <p style="margin:0; font-size:9px; color:#888;">Generated by LayBhari Restaurant OS Console</p>
  </div>
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
            <h2 className="text-2xl font-black text-cream tracking-tight">{hotelName}</h2>
            <p className="text-xs text-cream-muted font-bold uppercase tracking-widest mt-1">Table {tNum} · Bill</p>
            {contactPhone && <p className="text-[11px] text-cream-dim/70 mt-0.5">Tel: {contactPhone}</p>}
            <p className="text-xs text-cream-dim mt-1 opacity-60">{billDate}</p>
          </div>

          <div className="border-t border-dashed border-charcoal-border py-4 space-y-2 max-h-56 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-cream-muted font-medium">
                <span>{item.quantity}× {item.name}</span>
                <span>{currencySymbol}{((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-charcoal-border pt-4 space-y-1">
            <div className="flex justify-between text-sm text-cream-muted">
              <span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-cream-muted">
              <span>Tax / GST ({taxRate}%)</span><span>{currencySymbol}{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-brand mt-2">
              <span>Total</span><span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-cream-dim opacity-50 mt-4 font-medium">Thank you for dining at {hotelName} ✨</p>

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
