import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/initial_data', async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    let hotelId = req.headers['x-hotel-id'] || req.query.hotelId || null;
    if (!hotelId && token) {
      const user = await db.getUserByToken(token);
      if (user?.hotel_id) {
        hotelId = user.hotel_id;
      }
    }

    const [menuItems, orders, tables] = await Promise.all([
      hotelId ? db.getMenuItemsByHotel(hotelId) : db.getMenu(),
      db.getActiveOrders(hotelId),
      db.getTables(hotelId)
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
