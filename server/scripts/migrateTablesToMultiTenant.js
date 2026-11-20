import { pool } from '../src/db.js';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration for restaurant_tables and orders...');

    await client.query('ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS hotel_id UUID;');
    await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS hotel_id UUID;');
    await client.query('ALTER TABLE restaurant_tables DROP CONSTRAINT IF EXISTS restaurant_tables_number_key;');
    await client.query('ALTER TABLE restaurant_tables DROP CONSTRAINT IF EXISTS restaurant_tables_hotel_number_unique;');

    const grandHorizonId = 'f62a4b9a-cd74-462e-b429-f862ea3a4933';
    const laybhariId = '0a4fabc0-0b95-467b-a22c-252aec59f9c7';

    await client.query('UPDATE restaurant_tables SET hotel_id = $1 WHERE hotel_id IS NULL;', [grandHorizonId]);
    await client.query('UPDATE orders SET hotel_id = $1 WHERE hotel_id IS NULL;', [grandHorizonId]);

    // Seed 10 tables specifically for Hotel Lay Bhari
    for (let i = 1; i <= 10; i++) {
      const exists = await client.query(
        'SELECT id FROM restaurant_tables WHERE hotel_id = $1 AND number = $2;',
        [laybhariId, i]
      );
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO restaurant_tables (number, name, status, capacity, hotel_id) VALUES ($1, $2, $3, $4, $5);',
          [i, `Table ${i}`, i === 1 ? 'OCCUPIED' : 'AVAILABLE', i <= 4 ? 4 : 6, laybhariId]
        );
      }
    }

    // Also link active orders for Table 1 of Lay Bhari if any
    const existingOrder = await client.query("SELECT id FROM orders WHERE table_number = 1 LIMIT 1;");
    if (existingOrder.rows.length > 0) {
      // create a sample order for Lay Bhari Table 1 so KDS is live
      const checkLbOrder = await client.query("SELECT id FROM orders WHERE hotel_id = $1;", [laybhariId]);
      if (checkLbOrder.rows.length === 0) {
        await client.query(`
          INSERT INTO orders (id, table_number, items_json, total_price, status, hotel_id, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, NOW());
        `, [
          'order-lb-t1',
          1,
          JSON.stringify([
            { id: '1', name: 'Chicken Chilly', price: 200, quantity: 2 },
            { id: '2', name: 'Shev Bhaji', price: 160, quantity: 1 },
            { id: '3', name: 'Butter Roti', price: 25, quantity: 4 }
          ]),
          660,
          'PREPARING',
          laybhariId
        ]);
        await client.query(`
          UPDATE restaurant_tables 
          SET status = 'OCCUPIED', current_order_id = 'order-lb-t1'
          WHERE hotel_id = $1 AND number = 1;
        `, [laybhariId]);
      }
    }

    // Add composite constraint
    await client.query(`
      ALTER TABLE restaurant_tables ADD CONSTRAINT restaurant_tables_hotel_number_unique UNIQUE (hotel_id, number);
    `);

    console.log('✓ Migration completed successfully: restaurant_tables and orders are now multi-tenant!');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
