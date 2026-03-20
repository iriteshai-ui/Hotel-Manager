import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import NavBar from '../components/NavBar';
import BillModal from '../components/BillModal';

export default function ManagerDashboard() {
  const { tables, orders, isConnected, addTable, deleteTable, freeTable } = useSocket();
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeTab, setActiveTab] = useState('tables');
  const [newTableNum, setNewTableNum] = useState('');
  const [tableMsg, setTableMsg] = useState(null);
  const [insights, setInsights] = useState(null);
  const [billOrder, setBillOrder] = useState(null);
  const [insightsDate, setInsightsDate] = useState(new Date().toISOString().split('T')[0]);

  const handleShowQR = (table) => setSelectedTable(table);
  const closeModal = () => setSelectedTable(null);

  const getQRUrl = (tableId) => `${window.location.origin}/menu?table=${tableId}`;

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/insights/daily?date=${insightsDate}`, {
        headers: { 'X-Auth-Token': token }
      });
      const data = await res.json();
      setInsights(data);
    } catch (e) { setInsights(null); }
  };

  useEffect(() => {
    if (activeTab === 'insights') fetchInsights();
  }, [activeTab, insightsDate]);

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
              <span className="text-brand text-xs uppercase tracking-[0.3em] opacity-80">Digital Menu Access</span>
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
