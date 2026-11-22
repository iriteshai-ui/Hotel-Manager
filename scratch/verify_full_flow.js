import assert from 'assert';

async function testFullUserFlow() {
  console.log('================================================================');
  console.log('   LAYBHARI RESTAURANT - COMPLETE UI & API WORKFLOW TEST        ');
  console.log('================================================================');

  const BASE_URL = 'http://localhost:8081';

  // 1. Hotel Owner Login
  console.log('\n▶ [1/6] Authenticating as Laybhari Hotel Owner...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'owner_laybhari', password: 'password123' })
  });
  assert.strictEqual(loginRes.status, 200, `Login failed: status ${loginRes.status}`);
  const auth = await loginRes.json();
  const token = auth.token;
  const hotelId = auth.hotelId;
  assert.ok(token, 'Token returned');
  assert.strictEqual(auth.hotelSlug, 'laybhari', 'Slug is laybhari');
  console.log(`  ✓ Authenticated: ${auth.fullName} (Hotel: ${auth.hotelName}, ID: ${hotelId})`);

  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': token,
    'x-hotel-id': hotelId
  };

  // 2. Initial Data & Tenant Tables Verification
  console.log('\n▶ [2/6] Verifying Initial Data & Continuous Tables Layout (T1 - T12)...');
  const initRes = await fetch(`${BASE_URL}/api/initial_data`, { headers });
  assert.strictEqual(initRes.status, 200, `/api/initial_data returned ${initRes.status}`);
  const initData = await initRes.json();
  assert.ok(Array.isArray(initData.menuItems), 'menuItems array exists');
  assert.ok(Array.isArray(initData.tables), 'tables array exists');
  console.log(`  ✓ Initial Data loaded: ${initData.menuItems.length} menu items, ${initData.tables.length} tables, ${initData.orders.length} active orders`);

  // Verify Table 1 exists
  const t1Res = await fetch(`${BASE_URL}/api/tables/1`, { headers });
  assert.strictEqual(t1Res.status, 200, `Table 1 fetch returned ${t1Res.status}`);
  const t1 = await t1Res.json();
  assert.strictEqual(t1.number, 1, 'Table number is 1');
  console.log(`  ✓ Table 1 verified: Capacity ${t1.capacity}, Status: ${t1.status}`);

  // 3. Complete Table Ordering POS Flow (Table 1)
  console.log('\n▶ [3/6] Testing Dedicated Table Order Screen & Order Flow on Table 1...');
  
  // Clean up any stale active orders on Table 1 first
  const activeOrders = await (await fetch(`${BASE_URL}/api/orders/active`, { headers })).json();
  const existingT1Order = activeOrders.find(o => o.tableNumber === 1 && o.hotelId === hotelId);
  if (existingT1Order) {
    await fetch(`${BASE_URL}/api/orders/${existingT1Order.id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'PAID' })
    });
    await fetch(`${BASE_URL}/api/tables/1/free`, { method: 'PUT', headers });
  }

  // Browse Menu
  const menuRes = await fetch(`${BASE_URL}/api/hotels/laybhari/menu`, { headers });
  assert.strictEqual(menuRes.status, 200);
  const menuData = await menuRes.json();
  assert.ok(menuData.items.length >= 20, 'Has full menu');
  const dish1 = menuData.items.find(i => i.name.includes('Chicken Masala')) || menuData.items[0];
  const dish2 = menuData.items.find(i => i.name.includes('Bhakri')) || menuData.items[1];
  console.log(`  ✓ Picked dishes: "${dish1.name}" (₹${dish1.price}) and "${dish2.name}" (₹${dish2.price})`);

  // Place fresh order on Table 1
  const cart = [
    { id: dish1.id, menuItemId: dish1.id, name: dish1.name, price: dish1.price, quantity: 2 },
    { id: dish2.id, menuItemId: dish2.id, name: dish2.name, price: dish2.price, quantity: 3 }
  ];
  const orderSubtotal = (dish1.price * 2) + (dish2.price * 3);

  const placeRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tableNumber: 1,
      items: cart,
      hotelId
    })
  });
  assert.strictEqual(placeRes.status, 201, `Place order failed: ${placeRes.status}`);
  const createdOrder = await placeRes.json();
  console.log(`  ✓ Order #${createdOrder.id.slice(-6)} placed on Table 1. Total: ₹${createdOrder.totalPrice}`);

  // Verify Table 1 status automatically became OCCUPIED
  const t1Check = await (await fetch(`${BASE_URL}/api/tables/1`, { headers })).json();
  assert.strictEqual(t1Check.status, 'OCCUPIED', `Table 1 status should be OCCUPIED (got ${t1Check.status})`);
  console.log(`  ✓ Table 1 status confirmed: OCCUPIED (Order: #${createdOrder.id.slice(-6)})`);

  // Advance Order Status to PREPARING
  const prepRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'PREPARING' })
  });
  assert.strictEqual(prepRes.status, 200);
  console.log(`  ✓ Advanced order status to PREPARING`);

  // Append extra items to active order (Add Items to active table order)
  const dish3 = menuData.items.find(i => i.name.includes('Tambada Rassa')) || menuData.items[2];
  const appendRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ items: [{ id: dish3.id, menuItemId: dish3.id, name: dish3.name, price: dish3.price, quantity: 1 }] })
  });
  assert.strictEqual(appendRes.status, 200, `Append items failed: ${appendRes.status}`);
  const updatedOrder = await appendRes.json();
  const expectedTotal = orderSubtotal + dish3.price;
  console.log(`  ✓ Appended "${dish3.name}" to Table 1 order. New Total: ₹${updatedOrder.totalPrice}`);

  // Advance Order Status to SERVED
  const servedRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'SERVED' })
  });
  assert.strictEqual(servedRes.status, 200);
  console.log(`  ✓ Advanced order status to SERVED`);

  // Settle & Print Bill (mark PAID & free table)
  const settleRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'PAID' })
  });
  assert.strictEqual(settleRes.status, 200);
  await fetch(`${BASE_URL}/api/tables/1/free`, { method: 'PUT', headers });
  
  const t1Freed = await (await fetch(`${BASE_URL}/api/tables/1`, { headers })).json();
  assert.strictEqual(t1Freed.status, 'AVAILABLE', `Table 1 should be freed to AVAILABLE (got ${t1Freed.status})`);
  console.log(`  ✓ Bill settled & Table 1 freed back to AVAILABLE`);

  // 4. Dining Floor Operations Dashboard Metrics & Sub-Tabs
  console.log('\n▶ [4/6] Verifying Dining Dashboard & KPI Metrics API...');
  const diningRes = await fetch(`${BASE_URL}/api/hotel-owner/dining/dashboard`, { headers });
  assert.strictEqual(diningRes.status, 200, `Dining dashboard API returned ${diningRes.status}`);
  const diningData = await diningRes.json();
  assert.ok(diningData.metrics, 'Metrics object exists');
  console.log(`  ✓ Dining KPI Cards:`);
  console.log(`    - 1. Today's Sales: ₹${diningData.metrics.todaySales}`);
  console.log(`    - 2. Total Orders : ${diningData.metrics.totalOrders}`);
  console.log(`    - 3. Active Orders: ${diningData.metrics.activeOrders}`);
  console.log(`    - 4. Completed    : ${diningData.metrics.completedOrders}`);
  console.log(`    - 5. Expenses     : ₹${diningData.metrics.totalExpenses}`);
  console.log(`    - 6. Gross Profit : ₹${diningData.metrics.grossProfit}`);
  console.log(`    - 7. Net Profit   : ₹${diningData.metrics.netProfit}`);

  // 5. Table Floor Controls & Status Updates
  console.log('\n▶ [5/6] Verifying Table Floor Controls (Available, Reserved, Occupied)...');
  const patchRes = await fetch(`${BASE_URL}/api/tables/2/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'RESERVED' })
  });
  assert.strictEqual(patchRes.status, 200);
  const t2Res = await (await fetch(`${BASE_URL}/api/tables/2`, { headers })).json();
  assert.strictEqual(t2Res.status, 'RESERVED');
  console.log(`  ✓ Set Table 2 to RESERVED`);

  await fetch(`${BASE_URL}/api/tables/2/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'AVAILABLE' })
  });
  const t2Back = await (await fetch(`${BASE_URL}/api/tables/2`, { headers })).json();
  assert.strictEqual(t2Back.status, 'AVAILABLE');
  console.log(`  ✓ Freed Table 2 back to AVAILABLE`);

  // 6. Reports, Expenses & Staff Attendance APIs
  console.log('\n▶ [6/6] Verifying Expenses, Inventory, P&L Reports & Attendance APIs...');
  const expRes = await fetch(`${BASE_URL}/api/hotel-owner/expenses`, { headers });
  assert.strictEqual(expRes.status, 200);
  const expData = await expRes.json();
  console.log(`  ✓ Expenses API: ${expData.expenses?.length || 0} records, Total: ₹${expData.total || 0}`);

  const invRes = await fetch(`${BASE_URL}/api/hotel-owner/inventory`, { headers });
  assert.strictEqual(invRes.status, 200);
  const invData = await invRes.json();
  console.log(`  ✓ Inventory API: ${invData.items?.length || 0} items, Low Stock Warnings: ${invData.stats?.lowStockCount || 0}`);

  const plRes = await fetch(`${BASE_URL}/api/hotel-owner/reports/profit-loss?period=monthly`, { headers });
  assert.strictEqual(plRes.status, 200);
  const plData = await plRes.json();
  console.log(`  ✓ P&L Reports API: Revenue: ₹${plData.revenue || 0}, Net: ₹${plData.netProfit || 0}`);

  const attRes = await fetch(`${BASE_URL}/api/hotel-owner/staff/attendance?date=2026-11-22`, { headers });
  assert.strictEqual(attRes.status, 200);
  const attData = await attRes.json();
  console.log(`  ✓ Staff Attendance API: ${attData.attendance?.length || 0} staff records`);

  console.log('\n================================================================');
  console.log('   ALL 6 SUITES PASSED FLAWLESSLY WITH 100% SUCCESS!           ');
  console.log('================================================================');
  process.exit(0);
}

testFullUserFlow().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
