import { db } from '../db.js';

export async function authMiddleware(req, res, next) {
  const { path, method } = req;

  // Extract user from token if provided so req.user is populated for tenant checks
  const token = req.headers['x-auth-token'];
  if (token) {
    try {
      const user = await db.getUserByToken(token);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.error('Auth token lookup error:', err.message);
    }
  }

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

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
