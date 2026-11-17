import { db } from '../db.js';

export async function authMiddleware(req, res, next) {
  const { path, method } = req;

  // Exact public matches
  if (path === '/api/initial_data') {
    return next();
  }

  // Customers can place orders without auth
  if (path === '/api/orders' && method === 'POST') {
    return next();
  }

  // Auth routes are public
  if (path.startsWith('/api/auth')) {
    return next();
  }

  // Hotels & Onboarding routes are public
  if (path.startsWith('/api/hotels')) {
    return next();
  }

  // Health endpoint
  if (path === '/api/health') {
    return next();
  }

  // Non-API routes are public
  if (!path.startsWith('/api')) {
    return next();
  }

  const token = req.headers['x-auth-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
