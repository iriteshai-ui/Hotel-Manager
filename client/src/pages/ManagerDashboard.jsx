import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import NavBar from '../components/NavBar';

export default function ManagerDashboard() {
  const { tables, isConnected } = useSocket();
  const [selectedTable, setSelectedTable] = useState(null);

  const handleShowQR = (table) => setSelectedTable(table);
  const closeModal = () => setSelectedTable(null);

  const getQRUrl = (tableId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/menu?table=${tableId}`;
  };

  return (
    <div className="min-h-screen bg-charcoal text-cream pb-24">
      <NavBar 
        title="MANAGEMENT CORE" 
        statusBadge={
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {isConnected ? 'NODE ACTIVE' : 'RECONNECTING'}
          </span>
        }
      />
      
      <div className="max-w-[1400px] mx-auto px-6 mt-12">
        <div className="mb-12 text-cream">
          <h1 className="text-4xl font-black tracking-tighter mb-2">Floor Overview</h1>
          <p className="text-cream-dim text-xs font-bold tracking-widest uppercase opacity-60">Real-time table occupancy and digital access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-cream">
          {tables.map(table => (
            <div key={table.id} className="relative group p-8 rounded-[32px] bg-charcoal-light border border-charcoal-border transition-all duration-500 hover:-translate-y-1 hover:bg-charcoal-mid hover:shadow-2xl hover:shadow-brand/5">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-cream mb-1">{table.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${table.status === 'OCCUPIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {table.status}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-charcoal-mid border border-charcoal-border flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  🪑
                </div>
              </div>

              <button 
                onClick={() => handleShowQR(table)}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-charcoal-mid border border-charcoal-border text-cream-muted hover:bg-brand hover:text-white hover:border-brand-hover hover:shadow-lg hover:shadow-brand/20 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
              >
                Access Token
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Expansion */}
      {selectedTable && (
        <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-xl flex justify-center items-center z-[1000] p-6 animate-fade-in" onClick={closeModal}>
          <div className="bg-charcoal-light border border-charcoal-border p-10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] max-w-[450px] w-full flex flex-col items-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Decorative Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand/5 blur-[80px] rounded-full -z-10" />
            
            <h2 className="text-3xl font-black mb-8 text-cream text-center tracking-tight">
              {selectedTable.name}<br/>
              <span className="text-brand text-xs uppercase tracking-[0.3em] opacity-80">Digital Menu Access</span>
            </h2>

            <div className="p-6 bg-white rounded-[32px] border-4 border-charcoal-border mb-10 shadow-inner group transition-transform hover:scale-[1.02]">
              <QRCodeSVG value={getQRUrl(selectedTable.id)} size={220} />
            </div>

            <div className="flex gap-4 w-full">
              <a 
                href={getQRUrl(selectedTable.id)} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 flex items-center justify-center py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-brand text-white shadow-lg shadow-brand/20 hover:-translate-y-1 hover:shadow-brand/40 transition-all duration-300 no-underline"
              >
                Test Link
              </a>
              <button 
                onClick={closeModal}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-charcoal-mid border border-charcoal-border text-cream-muted hover:bg-charcoal-border hover:text-cream transition-all duration-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
