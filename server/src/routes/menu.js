import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const menu = await db.getMenu();
    res.json(menu);
  } catch (err) {
    console.error('Error fetching menu:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.post('/', async (req, res) => {
  try {
    const item = await db.addMenuItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    console.error('Error adding menu item:', err.message);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

export default router;
