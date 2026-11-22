const { pool } = require('../server/src/db');

async function main() {
  const hotelId = '0a4fabc0-0b95-467b-a22c-252aec59f9c7';

  // 1. Delete old test orders for Laybhari
  await pool.query('DELETE FROM orders WHERE hotel_id = $1', [hotelId]);
  console.log('Cleared old test orders for Laybhari.');

  // 2. Order 1 on Table 1: PREPARING (Cooking)
  const t1Items = [
    { name: 'Special Kolhapuri Tambada Rassa', price: 250, quantity: 2 },
    { name: 'Chicken Handi (Full)', price: 520, quantity: 1 },
    { name: '(Bajri) Bhakri', price: 30, quantity: 4 }
  ];
  const t1Total = 250 * 2 + 520 * 1 + 30 * 4; // 1140
  const o1Res = await pool.query(
    'INSERT INTO orders (id, table_number, items_json, total_price, status, timestamp, hotel_id) VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id;',
    ['lb-ord-live-t1', 1, JSON.stringify(t1Items), t1Total, 'PREPARING', hotelId]
  );
  const o1Id = o1Res.rows[0].id;

  // 3. Order 2 on Table 2: PLACED
  const t2Items = [
    { name: 'Chicken Chilly', price: 200, quantity: 1 },
    { name: 'Indrayani Rice (Full)', price: 80, quantity: 2 }
  ];
  const t2Total = 200 * 1 + 80 * 2; // 360
  const o2Res = await pool.query(
    'INSERT INTO orders (id, table_number, items_json, total_price, status, timestamp, hotel_id) VALUES ($1, $2, $3, $4, $5, NOW() - interval \'15 minutes\', $6) RETURNING id;',
    ['lb-ord-live-t2', 2, JSON.stringify(t2Items), t2Total, 'PLACED', hotelId]
  );
  const o2Id = o2Res.rows[0].id;

  // 4. Order 3 on Table 3: Settled bill earlier today
  const t3Items = [
    { name: 'Mutton Masala', price: 280, quantity: 2 },
    { name: '(Jwari) Bhakri', price: 40, quantity: 4 }
  ];
  const t3Total = 280 * 2 + 40 * 4; // 720
  await pool.query(
    'INSERT INTO orders (id, table_number, items_json, total_price, status, timestamp, hotel_id) VALUES ($1, $2, $3, $4, $5, NOW() - interval \'2 hours\', $6);',
    ['lb-ord-paid-t3', 3, JSON.stringify(t3Items), t3Total, 'PAID', hotelId]
  );

  // 5. Order 4 on Table 5: Settled bill yesterday
  const t5Items = [
    { name: 'Paneer Tikka Masala', price: 260, quantity: 2 },
    { name: 'Cheese Butter Naan', price: 80, quantity: 3 }
  ];
  const t5Total = 260 * 2 + 80 * 3; // 760
  await pool.query(
    'INSERT INTO orders (id, table_number, items_json, total_price, status, timestamp, hotel_id) VALUES ($1, $2, $3, $4, $5, NOW() - interval \'1 day\', $6);',
    ['lb-ord-paid-t5', 5, JSON.stringify(t5Items), t5Total, 'PAID', hotelId]
  );

  // 6. Reset all tables to AVAILABLE first
  await pool.query('UPDATE restaurant_tables SET status = \'AVAILABLE\', current_order_id = NULL WHERE hotel_id = $1;', [hotelId]);

  // Set Table 1 & Table 2 to OCCUPIED with their live orders
  await pool.query('UPDATE restaurant_tables SET status = \'OCCUPIED\', current_order_id = $1 WHERE hotel_id = $2 AND number = 1;', [o1Id, hotelId]);
  await pool.query('UPDATE restaurant_tables SET status = \'OCCUPIED\', current_order_id = $1 WHERE hotel_id = $2 AND number = 2;', [o2Id, hotelId]);

  console.log('Seeded realistic orders & updated table statuses successfully.');

  const tables = await pool.query('SELECT number, name, status, current_order_id FROM restaurant_tables WHERE hotel_id = $1 ORDER BY number;', [hotelId]);
  console.table(tables.rows);

  const orders = await pool.query('SELECT id, table_number, status, total_price, timestamp FROM orders WHERE hotel_id = $1 ORDER BY timestamp DESC;', [hotelId]);
  console.table(orders.rows);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
