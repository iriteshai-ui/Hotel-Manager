import { pool } from './db.js';

export async function seedRestaurantData() {
  const laybhariId = '0a4fabc0-0b95-467b-a22c-252aec59f9c7';

  // 1. Ensure tables exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurant_expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_method VARCHAR(50) DEFAULT 'CASH',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_restaurant_expenses_hotel_date ON restaurant_expenses(hotel_id, expense_date);

    CREATE TABLE IF NOT EXISTS restaurant_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
      unit VARCHAR(50) NOT NULL DEFAULT 'kg',
      min_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5,
      cost_per_unit NUMERIC(10, 2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'IN_STOCK',
      last_restocked TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_restaurant_inventory_hotel ON restaurant_inventory(hotel_id);
  `);

  // 2. Check and seed inventory
  const invRes = await pool.query('SELECT COUNT(*) FROM restaurant_inventory WHERE hotel_id = $1', [laybhariId]);
  if (parseInt(invRes.rows[0].count, 10) === 0) {
    const items = [
      ['Indrayani Rice', 'Grains & Rice', 45, 'kg', 10, 60, 'IN_STOCK'],
      ['Fresh Farm Chicken', 'Meat & Poultry', 18, 'kg', 8, 220, 'IN_STOCK'],
      ['Fresh Mutton (Goat)', 'Meat & Poultry', 12, 'kg', 5, 680, 'IN_STOCK'],
      ['Kolhapuri Kanda-Lasun Masala', 'Spices & Masalas', 8, 'kg', 3, 350, 'IN_STOCK'],
      ['Refined Sunflower Oil', 'Oils & Fats', 30, 'litres', 10, 140, 'IN_STOCK'],
      ['Fresh Malai Paneer', 'Dairy', 6.5, 'kg', 3, 320, 'IN_STOCK'],
      ['Jowar & Bajri Flour', 'Grains & Rice', 25, 'kg', 5, 45, 'IN_STOCK'],
      ['Amul Table Butter', 'Dairy', 4, 'kg', 2, 480, 'IN_STOCK'],
      ['Commercial LPG Cylinder', 'Gas & Utilities', 2, 'cylinders', 1, 1850, 'IN_STOCK'],
      ['Onions & Garlic (Red)', 'Vegetables', 14, 'kg', 15, 35, 'LOW_STOCK']
    ];

    for (const [name, cat, qty, unit, min, cost, st] of items) {
      await pool.query(
        `INSERT INTO restaurant_inventory (hotel_id, item_name, category, quantity, unit, min_threshold, cost_per_unit, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [laybhariId, name, cat, qty, unit, min, cost, st]
      );
    }
    console.log('Seeded Laybhari restaurant inventory.');
  }

  // 3. Check and seed expenses
  const expRes = await pool.query('SELECT COUNT(*) FROM restaurant_expenses WHERE hotel_id = $1', [laybhariId]);
  if (parseInt(expRes.rows[0].count, 10) === 0) {
    const expenses = [
      ['Morning Poultry & Chicken Delivery', 'Meat & Poultry', 3400, 'UPI', '15.5 kg dressed chicken'],
      ['Fresh Mutton Supply', 'Meat & Poultry', 4200, 'CASH', 'Fresh tender cuts'],
      ['Daily Vegetables & Herbs Mandi', 'Vegetables', 1150, 'CASH', 'Onions, tomatoes, coriander, green chillies'],
      ['Milk, Paneer & Butter Supply', 'Dairy', 1600, 'UPI', 'Daily morning dairy dispatch'],
      ['LPG Commercial Cylinder Refill', 'Gas & Utilities', 1850, 'UPI', 'Kitchen burner replacement']
    ];

    for (const [title, cat, amt, payMethod, notes] of expenses) {
      await pool.query(
        `INSERT INTO restaurant_expenses (hotel_id, title, category, amount, expense_date, payment_method, notes)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)`,
        [laybhariId, title, cat, amt, payMethod, notes]
      );
    }
    console.log('Seeded Laybhari restaurant expenses.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('seedRestaurantData.js')) {
  seedRestaurantData()
    .then(() => {
      console.log('Seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
