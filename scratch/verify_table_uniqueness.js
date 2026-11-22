const assert = require('assert');

const BASE_URL = 'http://localhost:8081';

async function run() {
  console.log('--- Testing Table Uniqueness & Duplicate Prevention ---');

  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'owner_laybhari', password: 'password123' })
  });
  assert(loginRes.status === 200, `Login status 200 (got ${loginRes.status})`);
  const { token, hotelId } = await loginRes.json();

  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': token,
    'x-hotel-id': hotelId
  };

  // 1. Try adding duplicate table number (Table 1 already exists)
  console.log('1. Testing duplicate table number rejection (Table 1)...');
  const dupNumRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: 1, capacity: 4 })
  });
  console.log(`   Status: ${dupNumRes.status}`);
  const dupNumJson = await dupNumRes.json();
  console.log(`   Response:`, dupNumJson);
  assert(dupNumRes.status === 400, `Expected 400 for duplicate table number, got ${dupNumRes.status}`);
  assert(dupNumJson.error && dupNumJson.error.toLowerCase().includes('already exists'), 'Expected duplicate error message');
  console.log('   ✓ Duplicate table number correctly blocked with 400');

  // 2. Try adding duplicate table name (e.g. "Table 2" with number 99)
  console.log('\n2. Testing duplicate table name rejection ("Table 2")...');
  const dupNameRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: 99, name: 'Table 2', capacity: 4 })
  });
  console.log(`   Status: ${dupNameRes.status}`);
  const dupNameJson = await dupNameRes.json();
  console.log(`   Response:`, dupNameJson);
  assert(dupNameRes.status === 400, `Expected 400 for duplicate table name, got ${dupNameRes.status}`);
  assert(dupNameJson.error && dupNameJson.error.toLowerCase().includes('already exists'), 'Expected duplicate error message');
  console.log('   ✓ Duplicate table name correctly blocked with 400');

  // 3. Try adding valid new table (Table 13)
  console.log('\n3. Testing valid new table addition (Table 13)...');
  const validAddRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: 13, name: 'Terrace VIP 13', capacity: 6 })
  });
  console.log(`   Status: ${validAddRes.status}`);
  const validAddJson = await validAddRes.json();
  console.log(`   Added table:`, validAddJson);
  assert(validAddRes.status === 201, `Expected 201, got ${validAddRes.status}`);
  assert(validAddJson.number === 13, 'Expected table 13');
  assert(validAddJson.name === 'Terrace VIP 13', 'Expected table name Terrace VIP 13');
  console.log('   ✓ Valid new table successfully created');

  // 4. Try adding Table 13 or "Terrace VIP 13" again -> must be rejected
  console.log('\n4. Testing immediate re-attempt of Table 13...');
  const reAddRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: 13, name: 'Terrace VIP 13', capacity: 6 })
  });
  console.log(`   Status: ${reAddRes.status}`);
  assert(reAddRes.status === 400, `Expected 400, got ${reAddRes.status}`);
  console.log('   ✓ Immediate duplicate addition rejected with 400');

  // 5. Clean up Table 13
  console.log('\n5. Deleting Table 13...');
  const delRes = await fetch(`${BASE_URL}/api/tables/13`, {
    method: 'DELETE',
    headers
  });
  console.log(`   Status: ${delRes.status}`);
  assert(delRes.status === 200, 'Expected 200 on delete');
  console.log('   ✓ Table 13 cleaned up');

  // 6. Verify table listing has strictly unique table numbers
  console.log('\n6. Verifying tables listing uniqueness for Laybhari...');
  const listRes = await fetch(`${BASE_URL}/api/tables`, { headers });
  const tables = await listRes.json();
  const seenNumbers = new Set();
  const seenNames = new Set();
  tables.forEach(t => {
    assert(!seenNumbers.has(t.number), `Duplicate table number detected: ${t.number}`);
    assert(!seenNames.has(t.name.toLowerCase()), `Duplicate table name detected: ${t.name}`);
    seenNumbers.add(t.number);
    seenNames.add(t.name.toLowerCase());
  });
  console.log(`   ✓ All ${tables.length} tables have strictly unique numbers and names!`);

  // 7. Verify dining dashboard metrics
  console.log('\n7. Verifying dining dashboard response...');
  const dashRes = await fetch(`${BASE_URL}/api/hotel-owner/dining-dashboard`, { headers });
  assert(dashRes.status === 200, 'Expected 200 on dining dashboard');
  const dashData = await dashRes.json();
  console.log('   Live metrics:', dashData.metrics);
  console.log('   Tables summary:', dashData.tables);
  assert(dashData.tables.total === 12, 'Expected 12 total tables');
  assert(dashData.tables.occupied === 2, 'Expected 2 occupied tables (T1 and T2)');

  console.log('\n=============================================');
  console.log('🎉 ALL TABLE UNIQUENESS & DEDUPLICATION TESTS PASSED!');
  console.log('=============================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
