import { Router } from 'express';
import { db } from '../db.js';
import { stompBroker } from '../stomp.js';

const router = Router();

function resolveHotelId(req) {
  if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.hotel_id) {
    return req.user.hotel_id;
  }
  return req.headers['x-hotel-id'] || req.query.hotelId || req.body?.hotelId || req.user?.hotel_id || null;
}

router.get('/', async (req, res) => {
  try {
    const hotelId = resolveHotelId(req);
    const tables = await db.getTables(hotelId);
    res.json(tables);
  } catch (err) {
    console.error('Error fetching tables:', err.message);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.get('/:number', async (req, res) => {
  try {
    const hotelId = resolveHotelId(req);
    const num = parseInt(req.params.number, 10);
    const tables = await db.getTables(hotelId);
    const table = tables.find(t => t.number === num);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (err) {
    console.error('Error fetching table:', err.message);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { number, capacity = 4, name } = req.body || {};
    const hotelId = resolveHotelId(req);
    const num = parseInt(number, 10);
    if (!num || num < 1) {
      return res.status(400).json({ error: 'Valid table number is required' });
    }

    try {
      const table = await db.addTable(num, capacity, hotelId, name);
      if (!table) {
        return res.status(400).json({ error: `Table ${num} already exists in this hotel` });
      }

      stompBroker.broadcast('/topic/table_added', table);
      res.status(201).json(table);
    } catch (dbErr) {
      if (['DUPLICATE_TABLE_NUMBER', 'DUPLICATE_TABLE_NAME', 'DUPLICATE_TABLE', 'INVALID_TABLE_NUMBER', '23505'].includes(dbErr.code)) {
        return res.status(400).json({ error: dbErr.message || `Table ${num} already exists` });
      }
      throw dbErr;
    }
  } catch (err) {
    console.error('Error adding table:', err.message);
    res.status(500).json({ error: err.message || 'Failed to add table' });
  }
});

router.delete('/:number', async (req, res) => {
  try {
    const hotelId = resolveHotelId(req);
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
    const hotelId = resolveHotelId(req);
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

const handleTableStatus = async (req, res) => {
  try {
    const hotelId = resolveHotelId(req);
    const num = parseInt(req.params.number, 10);
    const { status, currentOrderId } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const table = await db.updateTableStatus(num, status, currentOrderId, hotelId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    stompBroker.broadcast('/topic/table_updated', table);
    res.json(table);
  } catch (err) {
    console.error('Error updating table status:', err.message);
    res.status(500).json({ error: 'Failed to update table status' });
  }
};

router.patch('/:number/status', handleTableStatus);
router.put('/:number/status', handleTableStatus);

export default router;
