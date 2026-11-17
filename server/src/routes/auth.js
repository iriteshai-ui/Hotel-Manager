import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await db.findUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await db.createToken(user);
    res.json({
      token,
      role: user.role,
      username: user.username
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
    res.json({
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
