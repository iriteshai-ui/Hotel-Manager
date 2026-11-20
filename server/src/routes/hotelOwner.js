import { Router } from 'express';
import { multiTenantDb } from '../multiTenantDb.js';

const router = Router();

// Middleware: Resolve and Verify Hotel Tenant Authorization
function resolveTenantHotel(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super Admin can inspect any hotel via ?hotelId=xyz or header
  if (req.user.role === 'SUPER_ADMIN') {
    const specified = req.query.hotelId || req.headers['x-hotel-id'];
    if (specified) {
      req.targetHotelId = specified;
    } else if (req.user.hotel_id) {
      req.targetHotelId = req.user.hotel_id;
    } else {
      return res.status(400).json({ error: 'Super Admin: Please specify ?hotelId= query parameter' });
    }
    return next();
  }

  // Hotel staff & management roles: strictly enforce authenticated user's hotel_id
  const userRoles = [req.user.role, ...(req.user.roles || [])];
  const isHotelTenant = userRoles.some(r => ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'].includes(r));
  if (isHotelTenant) {
    if (!req.user.hotel_id) {
      return res.status(403).json({ error: 'Forbidden: No hotel property associated with this account' });
    }

    // If frontend sent a hotelId in query, params, or body, verify it matches
    const requestedHotelId = req.query.hotelId || req.params.hotelId || req.body?.hotelId || req.headers['x-hotel-id'];
    if (requestedHotelId && requestedHotelId !== req.user.hotel_id) {
      // Log security violation audit
      multiTenantDb.logAudit(req.user.hotel_id, req.user.user_id, req.user.username, 'SECURITY_VIOLATION_BLOCKED', 'TENANT_GUARD', {
        attemptedHotelId: requestedHotelId,
        authorizedHotelId: req.user.hotel_id
      }, req.ip);

      return res.status(403).json({
        error: 'Security Violation: Access to another hotel property data is strictly forbidden.'
      });
    }

    // Server-enforced hotel ID: Never trust client parameter
    req.targetHotelId = req.user.hotel_id;
    return next();
  }

  return res.status(403).json({ error: 'Forbidden: Hotel Owner credentials required' });
}

router.use(resolveTenantHotel);

// GET /api/hotel-owner/dashboard - Business Overview & Main Widgets
router.get('/dashboard', async (req, res) => {
  try {
    const data = await multiTenantDb.getHotelDashboard(req.targetHotelId);
    if (!data) return res.status(404).json({ error: 'Hotel not found' });
    res.json(data);
  } catch (err) {
    console.error('Hotel dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/hotel-owner/analytics - Sales & Revenue Analytics with Date Filters
router.get('/analytics', async (req, res) => {
  try {
    const filter = req.query.range || 'last_30_days';
    const analytics = await multiTenantDb.getHotelAnalytics(req.targetHotelId, filter);
    res.json(analytics);
  } catch (err) {
    console.error('Hotel analytics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/hotel-owner/bookings - Booking Management
router.get('/bookings', async (req, res) => {
  try {
    const { status, search } = req.query;
    const bookings = await multiTenantDb.getHotelBookings(req.targetHotelId, { status, search });
    res.json(bookings);
  } catch (err) {
    console.error('Hotel bookings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/hotel-owner/bookings - Create New Booking
router.post('/bookings', async (req, res) => {
  try {
    const booking = await multiTenantDb.createHotelBooking(req.targetHotelId, req.body);
    await multiTenantDb.logAudit(req.targetHotelId, req.user.user_id, req.user.username, 'CREATE_BOOKING', 'BOOKINGS', {
      bookingCode: booking.booking_code,
      guest: booking.guest_name,
      amount: booking.total_amount
    }, req.ip);

    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PATCH /api/hotel-owner/bookings/:id/status - Update Booking Status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updated = await multiTenantDb.updateBookingStatus(req.targetHotelId, id, status.toUpperCase());
    if (!updated) return res.status(404).json({ error: 'Booking not found or not owned by your hotel' });

    await multiTenantDb.logAudit(req.targetHotelId, req.user.user_id, req.user.username, 'UPDATE_BOOKING_STATUS', 'BOOKINGS', {
      bookingId: id,
      newStatus: status
    }, req.ip);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// GET /api/hotel-owner/rooms - Room Management
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await multiTenantDb.getHotelRooms(req.targetHotelId);
    res.json(rooms);
  } catch (err) {
    console.error('Hotel rooms error:', err.message);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/hotel-owner/rooms - Add New Room
router.post('/rooms', async (req, res) => {
  try {
    const room = await multiTenantDb.createHotelRoom(req.targetHotelId, req.body);
    await multiTenantDb.logAudit(req.targetHotelId, req.user.user_id, req.user.username, 'CREATE_ROOM', 'ROOMS', {
      roomNumber: room.room_number,
      category: room.category
    }, req.ip);

    res.status(201).json(room);
  } catch (err) {
    console.error('Create room error:', err.message);
    res.status(500).json({ error: 'Failed to create room (number may already exist)' });
  }
});

// PATCH /api/hotel-owner/rooms/:id/status - Update Room Status
router.patch('/rooms/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await multiTenantDb.updateRoomStatus(req.targetHotelId, id, status);
    if (!updated) return res.status(404).json({ error: 'Room not found or unauthorized' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room status' });
  }
});

// GET /api/hotel-owner/customers - Customer Management
router.get('/customers', async (req, res) => {
  try {
    const customers = await multiTenantDb.getHotelCustomers(req.targetHotelId);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/hotel-owner/financials - Financial Reports & Reconciliations
router.get('/financials', async (req, res) => {
  try {
    const financials = await multiTenantDb.getHotelFinancials(req.targetHotelId);
    res.json(financials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch financial report' });
  }
});

// GET /api/hotel-owner/staff - Staff & Operations
router.get('/staff', async (req, res) => {
  try {
    const staff = await multiTenantDb.getHotelStaff(req.targetHotelId);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/hotel-owner/staff - Add Staff Member
router.post('/staff', async (req, res) => {
  try {
    const staffMember = await multiTenantDb.createHotelStaff(req.targetHotelId, req.body);
    res.status(201).json(staffMember);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

export default router;
