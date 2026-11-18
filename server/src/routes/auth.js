import { Router } from 'express';
import { db } from '../db.js';
import { rbacDb } from '../rbacDb.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await db.findUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await db.createToken(user);
    
    // Fetch dynamic RBAC permissions and accessible modules for this user
    let rbacData = { roles: [user.role], roleDetails: [], permissions: {}, accessibleModules: [] };
    try {
      rbacData = await rbacDb.getUserRolesAndPermissions(user.id);
    } catch (e) {
      console.error('Failed to load RBAC permissions on login:', e.message);
    }

    res.json({
      token,
      userId: user.id,
      role: user.role,
      roles: rbacData.roles,
      roleDetails: rbacData.roleDetails,
      permissions: rbacData.permissions,
      accessibleModules: rbacData.accessibleModules,
      username: user.username,
      hotelId: user.hotel_id || null,
      hotelName: user.hotel_name || null,
      hotelSlug: user.hotel_slug || null,
      hotelCurrency: user.hotel_currency || 'USD',
      fullName: user.full_name || user.username,
      email: user.email || ''
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    if (token) {
      await db.removeToken(token);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.json({ message: 'Logged out' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    const user = await db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.user_id || user.user_db_id || user.id;
    let rbacData = { roles: [user.role], roleDetails: [], permissions: {}, accessibleModules: [] };
    if (userId) {
      try {
        rbacData = await rbacDb.getUserRolesAndPermissions(userId);
      } catch (e) {
        console.error('Failed to load RBAC on /me:', e.message);
      }
    }

    res.json({
      userId,
      username: user.username,
      role: user.role,
      roles: rbacData.roles,
      roleDetails: rbacData.roleDetails,
      permissions: rbacData.permissions,
      accessibleModules: rbacData.accessibleModules,
      hotelId: user.hotel_id || null,
      hotelName: user.hotel_name || null,
      hotelSlug: user.hotel_slug || null,
      hotelCurrency: user.hotel_currency || 'USD',
      fullName: user.full_name || user.username,
      email: user.email || ''
    });
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
