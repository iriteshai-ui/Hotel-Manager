import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      const role = result.role;
      if (role === 'SUPER_ADMIN') navigate('/superadmin', { replace: true });
      else if (role === 'HOTEL_OWNER') navigate('/hotel-dashboard', { replace: true });
      else if (role === 'MANAGER') navigate('/manager', { replace: true });
      else if (role === 'WAITER') navigate('/waiter', { replace: true });
      else if (role === 'KITCHEN') navigate('/kitchen', { replace: true });
      else navigate(from, { replace: true });
    } else {
      setError(result.error || 'Invalid username or password');
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20 mx-auto mb-4">
            <span className="text-white text-3xl font-black italic">A</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-cream">AURA Dining</h1>
          <p className="text-cream-muted text-xs font-bold tracking-widest uppercase mt-1 opacity-60">Staff Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-charcoal-light border border-charcoal-border rounded-[32px] p-8 space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-cream-dim mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full px-4 py-3 rounded-xl bg-charcoal border border-charcoal-border text-cream placeholder-cream-muted/40 focus:outline-none focus:border-brand text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-cream-dim mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 rounded-xl bg-charcoal border border-charcoal-border text-cream placeholder-cream-muted/40 focus:outline-none focus:border-brand text-sm font-medium"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-brand text-white font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 rounded-2xl bg-charcoal-light/50 border border-charcoal-border/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-cream-dim mb-3 text-center">
            One-Click Multi-Tenant Demo Logins
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin', 'super123')}
              className="w-full px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">👑 Super Admin</span>
              <span className="font-mono text-[11px] opacity-80">superadmin / super123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('owner_laybhari', 'password123')}
              className="w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">🍛 Hotel Lay Bhari (Owner)</span>
              <span className="font-mono text-[11px] opacity-80">owner_laybhari / password123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('owner_hotela', 'password123')}
              className="w-full px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">🏨 Hotel A (Grand Horizon)</span>
              <span className="font-mono text-[11px] opacity-80">owner_hotela / pwd123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('owner_hotelb', 'password123')}
              className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">🌴 Hotel B (Royal Palms)</span>
              <span className="font-mono text-[11px] opacity-80">owner_hotelb / pwd123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">📊 Restaurant Manager</span>
              <span className="font-mono text-[11px] opacity-80">admin / admin123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
