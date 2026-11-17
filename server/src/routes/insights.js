import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/daily', async (req, res) => {
  try {
    const insights = await db.getDailyInsights(req.query.date);
    res.json(insights);
  } catch (err) {
    console.error('Error fetching insights:', err.message);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
