const BASE_URL = 'http://localhost:8081';

async function run() {
  console.log('====================================================');
  console.log(' Hotel Lay Bhari: End-to-End Test for All 11 Tabs  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // --- Step 1: Login ---
  console.log('1. Testing User Login (owner_laybhari)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'owner_laybhari', password: 'password123' })
  });

  assert(loginRes.status === 200, `Login status 200 (got ${loginRes.status})`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  const hotelId = loginData.hotelId;
  const hotelSlug = loginData.hotelSlug;
  const hotelCurrency = loginData.hotelCurrency;

  assert(!!token, 'Auth token received');
  assert(loginData.username === 'owner_laybhari', `Username is owner_laybhari`);
  assert(hotelSlug === 'laybhari', `Hotel slug is laybhari (got ${hotelSlug})`);
  assert(hotelCurrency === 'INR', `Hotel currency is INR (got ${hotelCurrency})`);
  assert(!!hotelId, `Hotel ID resolved: ${hotelId}`);
  assert(loginData.role === 'HOTEL_OWNER', `Role is HOTEL_OWNER`);
  const hasDashboardMod = loginData.accessibleModules?.some(m => (m.code || m) === 'DASHBOARD');
  assert(hasDashboardMod, 'Has DASHBOARD module permission');
  const hasDiningMod = loginData.accessibleModules?.some(m => (m.code || m) === 'DINING_MENU');
  assert(hasDiningMod, 'Has DINING_MENU module permission');

  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': token,
    'x-hotel-id': hotelId
  };

  // --- Step 2: Tab 1 - Business Overview ---
  console.log('\n2. Testing Tab 1: Business Overview (GET /api/hotel-owner/dashboard)...');
  const dashRes = await fetch(`${BASE_URL}/api/hotel-owner/dashboard`, { headers });
  assert(dashRes.status === 200, `Dashboard status 200 (got ${dashRes.status})`);
  const dashData = await dashRes.json();
  assert(dashData.hotel?.name === 'Hotel Lay Bhari', `Hotel name matches: ${dashData.hotel?.name}`);
  assert(dashData.hotel?.currency === 'INR', `Hotel currency is INR`);
  assert(dashData.kpis !== undefined, 'KPIs present in dashboard data');
  console.log(`     Total Rooms: ${dashData.kpis?.totalRooms}, Occupied: ${dashData.kpis?.occupiedRooms}, Revenue: ₹${dashData.kpis?.totalRevenue}`);

  // --- Step 3: Tab 2 - Sales & Revenue Analytics ---
  console.log('\n3. Testing Tab 2: Sales & Revenue (GET /api/hotel-owner/analytics)...');
  const analyticsRes = await fetch(`${BASE_URL}/api/hotel-owner/analytics?range=last_30_days`, { headers });
  assert(analyticsRes.status === 200, `Analytics status 200 (got ${analyticsRes.status})`);
  const analyticsData = await analyticsRes.json();
  assert(Array.isArray(analyticsData.trends), 'Trends is an array');
  assert(Array.isArray(analyticsData.revenueByCategory), 'Revenue by category is an array');
  console.log(`     Trends entries: ${analyticsData.trends?.length}, Categories: ${analyticsData.revenueByCategory?.length}`);

  // --- Step 4: Tab 3 - Room Reservations ---
  console.log('\n4. Testing Tab 3: Room Reservations (GET & POST & PATCH)...');
  const bookingsRes = await fetch(`${BASE_URL}/api/hotel-owner/bookings`, { headers });
  assert(bookingsRes.status === 200, `Bookings status 200 (got ${bookingsRes.status})`);
  const bookings = await bookingsRes.json();
  assert(Array.isArray(bookings), `Bookings is an array (count: ${bookings.length})`);

  // Create test booking
  const newBookingRes = await fetch(`${BASE_URL}/api/hotel-owner/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      guestName: 'E2E Test Guest',
      guestEmail: 'e2e@laybhari.com',
      guestPhone: '+91 9999988888',
      roomNumber: '101',
      roomCategory: 'Executive Suite',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      totalAmount: 5000,
      paidAmount: 5000,
      paymentStatus: 'PAID',
      bookingSource: 'DIRECT',
      paymentMethod: 'UPI'
    })
  });
  assert(newBookingRes.status === 201, `Create booking status 201 (got ${newBookingRes.status})`);
  const createdBooking = await newBookingRes.json();
  assert(createdBooking.guest_name === 'E2E Test Guest', 'Guest name matches in created booking');

  // Update booking status
  const updateBookingRes = await fetch(`${BASE_URL}/api/hotel-owner/bookings/${createdBooking.id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'CONFIRMED' })
  });
  assert(updateBookingRes.status === 200, `Update booking status 200 (got ${updateBookingRes.status})`);
  const updatedBooking = await updateBookingRes.json();
  assert(updatedBooking.booking_status === 'CONFIRMED', 'Booking status is now CONFIRMED');

  // --- Step 5: Tab 4 - Room Inventory ---
  console.log('\n5. Testing Tab 4: Room Inventory (GET & POST & PATCH)...');
  const roomsRes = await fetch(`${BASE_URL}/api/hotel-owner/rooms`, { headers });
  assert(roomsRes.status === 200, `Rooms status 200 (got ${roomsRes.status})`);
  const rooms = await roomsRes.json();
  assert(Array.isArray(rooms), `Rooms is an array (count: ${rooms.length})`);

  // Create room 301 (or unique room number)
  const testRoomNumber = `30${Math.floor(Math.random() * 80 + 10)}`;
  const createRoomRes = await fetch(`${BASE_URL}/api/hotel-owner/rooms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      roomNumber: testRoomNumber,
      category: 'Deluxe Suite',
      pricePerNight: 3500,
      floor: 3,
      amenities: ['Balcony', 'AC', 'Smart TV']
    })
  });
  assert(createRoomRes.status === 201, `Create room status 201 (got ${createRoomRes.status})`);
  const createdRoom = await createRoomRes.json();
  assert(createdRoom.room_number === testRoomNumber, `Room number matches: ${testRoomNumber}`);

  // Update room status
  const updateRoomRes = await fetch(`${BASE_URL}/api/hotel-owner/rooms/${createdRoom.id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'CLEANING' })
  });
  assert(updateRoomRes.status === 200, `Update room status 200 (got ${updateRoomRes.status})`);
  const updatedRoom = await updateRoomRes.json();
  assert(updatedRoom.status === 'CLEANING', 'Room status updated to CLEANING');

  // --- Step 6: Tab 5 - Hotel Guests & CRM ---
  console.log('\n6. Testing Tab 5: Hotel Guests CRM (GET /api/hotel-owner/customers)...');
  const custRes = await fetch(`${BASE_URL}/api/hotel-owner/customers`, { headers });
  assert(custRes.status === 200, `Customers status 200 (got ${custRes.status})`);
  const customers = await custRes.json();
  assert(Array.isArray(customers), `Customers is an array (count: ${customers.length})`);

  // --- Step 7: Tab 6 - Dining Tables & Floor (CRITICAL CHECK) ---
  console.log('\n7. Testing Tab 6: Dining Tables & Floor (GET, POST, FREE, DELETE)...');
  const tablesRes = await fetch(`${BASE_URL}/api/tables`, { headers });
  assert(tablesRes.status === 200, `Tables status 200 (got ${tablesRes.status})`);
  const tables = await tablesRes.json();
  assert(Array.isArray(tables), `Tables is an array (count: ${tables.length})`);
  console.log(`     Initial tables for Lay Bhari: ${tables.map(t => `T${t.number}(${t.status})`).join(', ')}`);

  // Add Table 21
  const testTableNum = 21;
  const addTableRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: testTableNum, capacity: 6, hotelId })
  });
  assert(addTableRes.status === 200, `Add table 21 status 200 (got ${addTableRes.status})`);
  const addedTable = await addTableRes.json();
  assert(addedTable.number === testTableNum, `Table number is ${testTableNum}`);
  assert(addedTable.hotelId === hotelId, `Table hotelId correctly bound to Lay Bhari`);

  // Verify it exists in table list
  const tablesAfterAddRes = await fetch(`${BASE_URL}/api/tables`, { headers });
  const tablesAfterAdd = await tablesAfterAddRes.json();
  const table21Found = tablesAfterAdd.some(t => t.number === testTableNum);
  assert(table21Found, `Table ${testTableNum} is present in Lay Bhari table roster`);

  // Free table 21
  const freeTableRes = await fetch(`${BASE_URL}/api/tables/${testTableNum}/free`, {
    method: 'PUT',
    headers
  });
  assert(freeTableRes.status === 200, `Free table ${testTableNum} status 200`);

  // Delete table 21
  const delTableRes = await fetch(`${BASE_URL}/api/tables/${testTableNum}`, {
    method: 'DELETE',
    headers
  });
  assert(delTableRes.status === 200, `Delete table ${testTableNum} status 200`);

  // Verify it is gone
  const tablesAfterDelRes = await fetch(`${BASE_URL}/api/tables`, { headers });
  const tablesAfterDel = await tablesAfterDelRes.json();
  const table21Gone = !tablesAfterDel.some(t => t.number === testTableNum);
  assert(table21Gone, `Table ${testTableNum} successfully deleted and verified gone`);

  // --- Step 8: Tab 7 - Kitchen Orders (KDS) ---
  console.log('\n8. Testing Tab 7: Kitchen Orders (GET, POST order, UPDATE status)...');
  const ordersRes = await fetch(`${BASE_URL}/api/orders`, { headers });
  assert(ordersRes.status === 200, `Orders status 200 (got ${ordersRes.status})`);
  const orders = await ordersRes.json();
  assert(Array.isArray(orders), `Orders is an array (count: ${orders.length})`);

  // Place a test order for Table 2
  const placeOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tableNumber: 2,
      hotelId,
      items: [
        { id: 'item_1', name: 'Paneer Tikka Kabab', price: 230, quantity: 2 },
        { id: 'item_2', name: 'Butter Roti', price: 25, quantity: 4 }
      ]
    })
  });
  assert(placeOrderRes.status === 200, `Place order on Table 2 status 200 (got ${placeOrderRes.status})`);
  const newOrder = await placeOrderRes.json();
  assert(newOrder.tableNumber === 2, 'Order placed on Table 2');
  const totalVal = newOrder.totalPrice ?? newOrder.total;
  assert(totalVal === 560, `Total calculated correctly (got ₹${totalVal})`);

  // Update order status to PREPARING
  const updateOrderRes = await fetch(`${BASE_URL}/api/orders/${newOrder.id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'PREPARING' })
  });
  assert(updateOrderRes.status === 200, `Update order to PREPARING status 200`);

  // Update order status to PAID
  const payOrderRes = await fetch(`${BASE_URL}/api/orders/${newOrder.id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'PAID' })
  });
  assert(payOrderRes.status === 200, `Update order to PAID status 200`);

  // Free table 2
  await fetch(`${BASE_URL}/api/tables/2/free`, { method: 'PUT', headers });

  // --- Step 9: Tab 8 - Restaurant Food Menu ---
  console.log('\n9. Testing Tab 8: Restaurant Food Menu (GET /api/hotels/laybhari/menu & PATCH bestseller)...');
  const menuRes = await fetch(`${BASE_URL}/api/hotels/laybhari/menu`, { headers });
  assert(menuRes.status === 200, `Menu status 200 (got ${menuRes.status})`);
  const menuData = await menuRes.json();
  const menuItems = menuData.items || [];
  assert(menuItems.length >= 95, `Lay Bhari menu items count >= 95 (got ${menuItems.length})`);
  console.log(`     Total menu items loaded: ${menuItems.length}`);

  // Test toggling bestseller on first item
  if (menuItems.length > 0) {
    const firstItem = menuItems[0];
    const initialBestseller = !!firstItem.isBestseller;
    const toggleRes = await fetch(`${BASE_URL}/api/hotels/laybhari/menu/${firstItem.id}/bestseller`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isBestseller: !initialBestseller })
    });
    assert(toggleRes.status === 200, `Toggle bestseller on "${firstItem.name}" status 200`);
    // Revert back
    await fetch(`${BASE_URL}/api/hotels/laybhari/menu/${firstItem.id}/bestseller`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isBestseller: initialBestseller })
    });
  }

  // --- Step 10: Tab 9 - Financial Reports ---
  console.log('\n10. Testing Tab 9: Financial Reports (GET /api/hotel-owner/financials)...');
  const finRes = await fetch(`${BASE_URL}/api/hotel-owner/financials`, { headers });
  assert(finRes.status === 200, `Financials status 200 (got ${finRes.status})`);
  const finData = await finRes.json();
  assert(finData.grossSales !== undefined || finData.grossRevenue !== undefined, 'Financials contains gross sales/revenue');
  assert(finData.netSales !== undefined || finData.netRevenue !== undefined, 'Financials contains net sales/revenue');
  console.log(`     Gross Sales: ₹${finData.grossSales ?? finData.grossRevenue}, Net Sales: ₹${finData.netSales ?? finData.netRevenue}, Tax: ₹${finData.totalTaxes ?? finData.taxCollected}`);

  // --- Step 11: Tab 10 - Staff Operations ---
  console.log('\n11. Testing Tab 10: Staff Operations (GET & POST)...');
  const staffRes = await fetch(`${BASE_URL}/api/hotel-owner/staff`, { headers });
  assert(staffRes.status === 200, `Staff status 200 (got ${staffRes.status})`);
  const staffList = await staffRes.json();
  assert(Array.isArray(staffList), `Staff is an array (count: ${staffList.length})`);

  // Add staff member
  const addStaffRes = await fetch(`${BASE_URL}/api/hotel-owner/staff`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'E2E Test Staff',
      role: 'Floor Captain',
      email: 'staff.test@laybhari.com',
      phone: '+91 9888877777',
      shift: 'EVENING'
    })
  });
  assert(addStaffRes.status === 201, `Add staff status 201 (got ${addStaffRes.status})`);
  const addedStaff = await addStaffRes.json();
  assert(addedStaff.name === 'E2E Test Staff', 'Staff name matches');

  // --- Step 12: Tab 11 - Property Settings ---
  console.log('\n12. Testing Tab 11: Property Settings...');
  assert(dashData.hotel?.slug === 'laybhari', 'Hotel slug verified');
  assert(dashData.hotel?.theme !== undefined, 'Hotel theme settings verified');

  console.log('\n====================================================');
  console.log(` Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
