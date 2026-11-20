import { Router } from 'express';
import { db } from '../db.js';
import { stompBroker } from '../stomp.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'] || req.user?.hotel_id || req.query.hotelId || null;
    const tables = await db.getTables(hotelId);
    res.json(tables);
  } catch (err) {
    console.error('Error fetching tables:', err.message);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { number, capacity = 4, hotelId: bodyHotelId } = req.body || {};
    const hotelId = bodyHotelId || req.headers['x-hotel-id'] || req.user?.hotel_id || null;
    const num = parseInt(number, 10);
    if (!num || num < 1) {
      return res.status(400).json({ error: 'Valid table number is required' });
    }

    const table = await db.addTable(num, capacity, hotelId);
    if (!table) {
      return res.status(400).json({ error: `Table ${num} already exists in this hotel` });
    }

    stompBroker.broadcast('/topic/table_added', table);
    res.json(table);
  } catch (err) {
    console.error('Error adding table:', err.message);
    res.status(500).json({ error: 'Failed to add table' });
  }
});

router.delete('/:number', async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'] || req.user?.hotel_id || req.query.hotelId || null;
    const num = parseInt(req.params.number, 10);
    const success = await db.deleteTable(num, hotelId);
    if (!success) {
      return res.status(404).json({ error: 'Table not found' });
    }

    stompBroker.broadcast('/topic/table_deleted', { id: `t${num}`, number: num, hotelId });
    res.json({ message: 'Table deleted' });
  } catch (err) {
    console.error('Error deleting table:', err.message);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

router.put('/:number/free', async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'] || req.user?.hotel_id || req.query.hotelId || null;
    const num = parseInt(req.params.number, 10);
    const table = await db.freeTable(num, hotelId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    stompBroker.broadcast('/topic/table_updated', table);
    res.json(table);
  } catch (err) {
    console.error('Error freeing table:', err.message);
    res.status(500).json({ error: 'Failed to free table' });
  }
});

export default router;
