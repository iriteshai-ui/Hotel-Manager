import { Router } from 'express';
import { db } from '../db.js';
import { stompBroker } from '../stomp.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { tableNumber, items, hotelId: bodyHotelId } = req.body || {};
    const hotelId = bodyHotelId || req.headers['x-hotel-id'] || req.user?.hotel_id || null;
    const num = parseInt(tableNumber, 10);
    if (!num) {
      return res.status(400).json({ error: 'Valid table number is required' });
    }

    const newOrder = await db.placeOrder(num, items || [], hotelId);
    stompBroker.broadcast('/topic/order_added', newOrder);

    const tableUpdate = {
      id: `t${num}`,
      number: num,
      name: `Table ${num}`,
      status: 'OCCUPIED',
      currentOrderId: newOrder.id,
      capacity: 4,
      hotelId
    };
    stompBroker.broadcast('/topic/table_updated', tableUpdate);

    res.json(newOrder);
  } catch (err) {
    console.error('Error placing order:', err.message);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

router.get('/', async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'] || req.user?.hotel_id || req.query.hotelId || null;
    const orders = await db.getAllOrders(hotelId);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const hotelId = req.headers['x-hotel-id'] || req.user?.hotel_id || req.query.hotelId || null;
    const orders = await db.getActiveOrders(hotelId);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching active orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error fetching order by ID:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    const updatedOrder = await db.updateOrderStatus(req.params.id, status);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    stompBroker.broadcast('/topic/order_updated', updatedOrder);

    if (status === 'PAID') {
      const tableUpdate = {
        id: `t${updatedOrder.tableNumber}`,
        number: updatedOrder.tableNumber,
        name: `Table ${updatedOrder.tableNumber}`,
        status: 'AVAILABLE',
        currentOrderId: null,
        capacity: 4
      };
      stompBroker.broadcast('/topic/table_updated', tableUpdate);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
