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

// GET /api/hotel-owner/staff/attendance - Get daily staff attendance & summary for a date
router.get('/staff/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    const data = await multiTenantDb.getStaffAttendanceByDate(req.targetHotelId, date);
    res.json(data);
  } catch (err) {
    console.error('Fetch staff attendance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch staff attendance' });
  }
});

// POST /api/hotel-owner/staff/attendance - Mark or update attendance for a staff member
router.post('/staff/attendance', async (req, res) => {
  try {
    const { staffId, date, status, notes } = req.body || {};
    if (!staffId) return res.status(400).json({ error: 'Staff ID is required' });
    if (!status) return res.status(400).json({ error: 'Attendance status is required (PRESENT, ABSENT, HALF_DAY, LEAVE)' });

    const marked = await multiTenantDb.markStaffAttendance(req.targetHotelId, {
      staffId,
      date,
      status,
      notes: notes || '',
      markedBy: req.user?.username || req.user?.name || 'Hotel Owner'
    });

    const refreshed = await multiTenantDb.getStaffAttendanceByDate(req.targetHotelId, date || marked.attendance_date);

    res.json({
      success: true,
      record: marked,
      summary: refreshed.summary
    });
  } catch (err) {
    console.error('Mark staff attendance error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to record attendance' });
  }
});

// POST /api/hotel-owner/staff/attendance/batch - Batch mark all staff (e.g. Mark All Present)
router.post('/staff/attendance/batch', async (req, res) => {
  try {
    const { date, status = 'PRESENT' } = req.body || {};
    const result = await multiTenantDb.batchMarkStaffAttendance(req.targetHotelId, {
      date,
      status,
      markedBy: req.user?.username || req.user?.name || 'Hotel Owner'
    });

    res.json({
      success: true,
      message: `All staff marked as ${status}`,
      ...result
    });
  } catch (err) {
    console.error('Batch attendance error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to batch mark attendance' });
  }
});

// GET /api/hotel-owner/staff/:id/attendance-history - Monthly attendance history for a staff member
router.get('/staff/:id/attendance-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { month } = req.query; // YYYY-MM
    const historyData = await multiTenantDb.getStaffMonthlyHistory(req.targetHotelId, id, month);
    if (!historyData) {
      return res.status(404).json({ error: 'Staff member not found or access denied' });
    }

    res.json(historyData);
  } catch (err) {
    console.error('Staff attendance history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch staff attendance history' });
  }
});

// GET /api/hotel-owner/hotel and /api/hotel-owner/hotel/profile
const getHotelDetails = async (req, res) => {
  try {
    const hotel = await multiTenantDb.getHotelById(req.targetHotelId);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    console.error('Fetch hotel profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hotel details' });
  }
};
router.get('/hotel', getHotelDetails);
router.get('/hotel/profile', getHotelDetails);

// PUT /api/hotel-owner/hotel - Hotel Owner: Update own hotel details
router.put('/hotel', async (req, res) => {
  try {
    const { name, currency, taxPercentage, contactEmail, contactPhone, status, totalRooms } = req.body || {};
    const updated = await multiTenantDb.updateHotel(req.targetHotelId, {
      name,
      currency,
      taxPercentage,
      contactEmail,
      contactPhone,
      status,
      totalRooms
    });
    if (!updated) return res.status(404).json({ error: 'Hotel not found' });

    await multiTenantDb.logAudit(req.targetHotelId, req.user.user_id, req.user.username, 'UPDATE_HOTEL_SETTINGS', 'SETTINGS', {
      hotelName: updated.name,
      updatedFields: req.body
    });

    res.json({ success: true, hotel: updated });
  } catch (err) {
    console.error('Update hotel error:', err.message);
    res.status(500).json({ error: 'Failed to update hotel details' });
  }
});

// PATCH /api/hotel-owner/hotel/status - Hotel Owner: Toggle hotel active/inactive status
router.patch('/hotel/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Valid status required (ACTIVE or INACTIVE)' });
    }
    const updated = await multiTenantDb.toggleHotelStatus(req.targetHotelId, status.toUpperCase());
    if (!updated) return res.status(404).json({ error: 'Hotel not found' });

    await multiTenantDb.logAudit(req.targetHotelId, req.user.user_id, req.user.username, 'UPDATE_HOTEL_STATUS', 'SETTINGS', {
      status: status.toUpperCase()
    });

    res.json({ success: true, hotel: updated });
  } catch (err) {
    console.error('Toggle hotel status error:', err.message);
    res.status(500).json({ error: 'Failed to update hotel status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DINING DASHBOARD, EXPENSES, INVENTORY, AND PROFIT & LOSS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/hotel-owner/dining/dashboard - Dedicated Restaurant First Dining Dashboard
router.get('/dining/dashboard', async (req, res) => {
  try {
    const data = await multiTenantDb.getDiningDashboardData(req.targetHotelId);
    res.json(data);
  } catch (err) {
    console.error('Dining dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dining dashboard data' });
  }
});

// GET /api/hotel-owner/expenses - Get restaurant expenses
router.get('/expenses', async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const data = await multiTenantDb.getRestaurantExpenses(req.targetHotelId, { startDate, endDate, category });
    res.json(data);
  } catch (err) {
    console.error('Expenses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/hotel-owner/expenses - Add an expense
router.post('/expenses', async (req, res) => {
  try {
    const { title, category, amount, expenseDate, paymentMethod, notes } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'Expense title is required' });
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Valid positive expense amount required' });

    const expense = await multiTenantDb.addRestaurantExpense(req.targetHotelId, {
      title,
      category: category || 'Raw Materials / Groceries',
      amount: numAmount,
      expenseDate,
      paymentMethod: paymentMethod || 'CASH',
      notes: notes || ''
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error('Add expense error:', err.message);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// DELETE /api/hotel-owner/expenses/:id - Delete an expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const deleted = await multiTenantDb.deleteRestaurantExpense(req.targetHotelId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err.message);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/hotel-owner/inventory - Get restaurant inventory & stock alerts
router.get('/inventory', async (req, res) => {
  try {
    const { category, status } = req.query;
    const data = await multiTenantDb.getRestaurantInventory(req.targetHotelId, { category, status });
    res.json(data);
  } catch (err) {
    console.error('Inventory error:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/hotel-owner/inventory - Add inventory item
router.post('/inventory', async (req, res) => {
  try {
    const { itemName, category, quantity, unit, minThreshold, costPerUnit } = req.body || {};
    if (!itemName || !itemName.trim()) return res.status(400).json({ error: 'Item name is required' });

    const item = await multiTenantDb.addRestaurantInventoryItem(req.targetHotelId, {
      itemName,
      category: category || 'Grains & Rice',
      quantity: parseFloat(quantity) || 0,
      unit: unit || 'kg',
      minThreshold: parseFloat(minThreshold) || 5,
      costPerUnit: parseFloat(costPerUnit) || 0
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Add inventory error:', err.message);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// PUT /api/hotel-owner/inventory/:id - Update inventory item
router.put('/inventory/:id', async (req, res) => {
  try {
    const updated = await multiTenantDb.updateRestaurantInventoryItem(req.targetHotelId, req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update inventory error:', err.message);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// DELETE /api/hotel-owner/inventory/:id - Delete inventory item
router.delete('/inventory/:id', async (req, res) => {
  try {
    const deleted = await multiTenantDb.deleteRestaurantInventoryItem(req.targetHotelId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    console.error('Delete inventory error:', err.message);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// GET /api/hotel-owner/reports/profit-loss - Restaurant Profit & Loss Summary
router.get('/reports/profit-loss', async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const report = await multiTenantDb.getProfitAndLossReport(req.targetHotelId, { period, startDate, endDate });
    res.json(report);
  } catch (err) {
    console.error('P&L report error:', err.message);
    res.status(500).json({ error: 'Failed to generate profit and loss report' });
  }
});

export default router;
