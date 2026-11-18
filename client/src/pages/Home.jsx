import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function Home() {
  const dashboards = [
    {
      title: 'Super Admin Console',
      desc: 'Platform-wide oversight, cross-hotel metrics & audit logs.',
      path: '/superadmin',
      icon: '👑',
      color: 'from-purple-600 to-indigo-700',
      badge: 'Platform Owner'
    },
    {
      title: 'Hotel Owner Dashboard',
      desc: 'Isolated property KPIs, room availability, bookings & ledger.',
      path: '/hotel-dashboard',
      icon: '🏨',
      color: 'from-blue-600 to-cyan-700',
      badge: 'Hotel Owner'
    },
    {
      title: 'Customer Menu',
      desc: 'Seamless ordering experience for your guests.',
      path: '/menu',
      icon: '🍽️',
      color: 'from-brand to-[#926c15]',
      badge: 'Guest Portal'
    },
    {
      title: 'Kitchen Display',
      desc: 'Real-time order management for the culinary team.',
      path: '/kitchen',
      icon: '👨‍🍳',
      color: 'from-rose-500 to-rose-700',
      badge: 'Live'
    },
    {
      title: 'Waiter Dashboard',
      desc: 'Coordinate service and track table readiness.',
      path: '/waiter',
      icon: '🤵',
      color: 'from-emerald-500 to-emerald-700',
      badge: 'Service'
    },
    {
      title: 'Management',
      desc: 'Oversee operations, tables, and dining analytics.',
      path: '/manager',
      icon: '📊',
      color: 'from-blue-500 to-indigo-700',
      badge: 'Admin'
    },
    {
      title: 'Property Onboarding',
      desc: 'Register hotel tenants, customize theme branding & build menus.',
      path: '/onboarding',
      icon: '⚡',
      color: 'from-amber-500 to-amber-700',
      badge: 'Wizard'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-charcoal">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 text-center overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-brand/5 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold tracking-[0.3em] uppercase mb-6 animate-fade-in text-brand font-black">
            Celestial Culinary Experience
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-cream mb-6 drop-shadow-2xl">
            AURA <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-[#f3d382] to-brand-hover">DINING</span>
          </h1>
          <p className="text-xl text-cream-muted max-w-2xl mx-auto leading-relaxed font-medium">
            Where modern intelligence meets world-class gastronomy. 
            Select your portal to begin the journey.
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <main className="flex-1 max-w-[1400px] mx-auto px-6 pb-24 w-full text-cream">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {dashboards.map((dash, idx) => (
            <Link 
              key={idx} 
              to={dash.path} 
              className="group relative flex flex-col no-underline transition-all duration-500 hover:-translate-y-2"
            >
              {/* Card Container */}
              <div className="relative h-full p-8 rounded-[32px] bg-charcoal-light border border-charcoal-border overflow-hidden transition-all duration-500 group-hover:bg-charcoal-mid group-hover:border-brand-border/50 group-hover:shadow-[0_20px_50px_rgba(212,175,55,0.1)]">
                
                {/* Accent Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${dash.color} opacity-0 blur-[60px] group-hover:opacity-20 transition-opacity duration-700`} />
                
                {/* content */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-charcoal-mid border border-charcoal-border flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                      {dash.icon}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-charcoal-mid border border-charcoal-border text-[10px] font-black uppercase tracking-widest text-cream-dim group-hover:border-brand/30 group-hover:text-brand transition-colors">
                      {dash.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-cream mb-3 tracking-tight group-hover:text-brand transition-colors">
                    {dash.title}
                  </h3>
                  <p className="text-cream-muted leading-relaxed font-medium text-sm mb-8 flex-1">
                    {dash.desc}
                  </p>

                  <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                    Access Portal
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-charcoal-border text-center">
        <p className="text-cream-dim text-xs font-bold tracking-[0.2em] uppercase">
          &copy; 2026 AURA DINING GROUP &middot; EST: 2026
        </p>
      </footer>
    </div>
  );
}
