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
      if (role === 'MANAGER') navigate('/manager', { replace: true });
      else if (role === 'WAITER') navigate('/waiter', { replace: true });
      else if (role === 'KITCHEN') navigate('/kitchen', { replace: true });
      else navigate(from, { replace: true });
    } else {
      setError('Invalid username or password');
    }
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
          <p className="text-xs font-black uppercase tracking-widest text-cream-dim mb-3 text-center">Default Credentials</p>
          <div className="space-y-1 text-xs font-medium text-cream-muted">
            <div className="flex justify-between"><span>Manager:</span><span className="font-mono text-brand">admin / admin123</span></div>
            <div className="flex justify-between"><span>Waiter:</span><span className="font-mono text-brand">waiter / waiter123</span></div>
            <div className="flex justify-between"><span>Kitchen:</span><span className="font-mono text-brand">kitchen / kitchen123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
