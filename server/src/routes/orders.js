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

router.post('/', async (req, res) => {
  try {
    const { tableNumber, items } = req.body || {};
    const hotelId = resolveHotelId(req);
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

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error placing order:', err.message);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

router.get('/', async (req, res) => {
  try {
    const hotelId = resolveHotelId(req);
    const orders = await db.getAllOrders(hotelId);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const hotelId = resolveHotelId(req);
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

router.post('/:id/items', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid items array is required' });
    }
    const updatedOrder = await db.addItemsToOrder(req.params.id, items);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    stompBroker.broadcast('/topic/order_updated', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error adding items to order:', err.message);
    res.status(500).json({ error: 'Failed to add items to order' });
  }
});

// Update / Replace placed items (e.g. removing mistakenly added dishes or adjusting quantity)
router.put('/:id/items', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Valid items array is required' });
    }
    const updatedOrder = await db.updateOrderItems(req.params.id, items);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    stompBroker.broadcast('/topic/order_updated', updatedOrder);

    if (updatedOrder.status === 'CANCELLED') {
      const tableUpdate = {
        id: `t${updatedOrder.tableNumber}`,
        number: updatedOrder.tableNumber,
        name: `Table ${updatedOrder.tableNumber}`,
        status: 'AVAILABLE',
        currentOrderId: null,
        capacity: 4,
        hotelId: updatedOrder.hotelId
      };
      stompBroker.broadcast('/topic/table_updated', tableUpdate);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating items in order:', err.message);
    res.status(500).json({ error: 'Failed to update order items' });
  }
});

// Cancel active order and free table
router.post('/:id/cancel', async (req, res) => {
  try {
    const updatedOrder = await db.updateOrderStatus(req.params.id, 'CANCELLED');
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    stompBroker.broadcast('/topic/order_updated', updatedOrder);

    const tableUpdate = {
      id: `t${updatedOrder.tableNumber}`,
      number: updatedOrder.tableNumber,
      name: `Table ${updatedOrder.tableNumber}`,
      status: 'AVAILABLE',
      currentOrderId: null,
      capacity: 4,
      hotelId: updatedOrder.hotelId
    };
    stompBroker.broadcast('/topic/table_updated', tableUpdate);

    res.json({ success: true, order: updatedOrder, message: 'Order cancelled and table freed' });
  } catch (err) {
    console.error('Error cancelling order:', err.message);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Delete active order (removes mistakenly placed order and frees table)
router.delete('/:id', async (req, res) => {
  try {
    const updatedOrder = await db.updateOrderStatus(req.params.id, 'CANCELLED');
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    stompBroker.broadcast('/topic/order_updated', updatedOrder);

    const tableUpdate = {
      id: `t${updatedOrder.tableNumber}`,
      number: updatedOrder.tableNumber,
      name: `Table ${updatedOrder.tableNumber}`,
      status: 'AVAILABLE',
      currentOrderId: null,
      capacity: 4,
      hotelId: updatedOrder.hotelId
    };
    stompBroker.broadcast('/topic/table_updated', tableUpdate);

    res.json({ success: true, order: updatedOrder, message: 'Order removed and table freed' });
  } catch (err) {
    console.error('Error deleting order:', err.message);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

const handleOrderStatusUpdate = async (req, res) => {
  try {
    const { status } = req.body || {};
    const updatedOrder = await db.updateOrderStatus(req.params.id, status);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    stompBroker.broadcast('/topic/order_updated', updatedOrder);

    if (status === 'PAID' || status === 'CANCELLED') {
      const tableUpdate = {
        id: `t${updatedOrder.tableNumber}`,
        number: updatedOrder.tableNumber,
        name: `Table ${updatedOrder.tableNumber}`,
        status: 'AVAILABLE',
        currentOrderId: null,
        capacity: 4,
        hotelId: updatedOrder.hotelId
      };
      stompBroker.broadcast('/topic/table_updated', tableUpdate);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

router.put('/:id/status', handleOrderStatusUpdate);
router.patch('/:id/status', handleOrderStatusUpdate);

export default router;
