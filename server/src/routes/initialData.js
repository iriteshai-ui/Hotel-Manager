import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/initial_data', async (req, res) => {
  try {
    const [menuItems, orders, tables] = await Promise.all([
      db.getMenu(),
      db.getActiveOrders(),
      db.getTables()
    ]);
    res.json({
      menuItems,
      orders,
      tables
    });
  } catch (err) {
    console.error('Initial data error:', err.message);
    res.status(500).json({ error: 'Failed to fetch initial data' });
  }
});

export default router;
