import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: parseInt(process.env.PGPORT, 10) || 6543,
  user: process.env.PGUSER || 'postgres.cljyxyhtkysioihhqtxw',
  password: process.env.PGPASSWORD || 'gSPD-E@mDb@MW4k',
  database: process.env.PGDATABASE || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const INITIAL_MENU = [
  { id: '1', name: 'Paneer Tikka', price: 349, category: 'Starter', description: 'Smokey grilled Cottage Cheese marinated in spiced yogurt, served with mint chutney', imageUrl: '/images/paneer_tikka.png' },
  { id: '2', name: 'Chicken Wings', price: 399, category: 'Starter', description: 'Crispy fried wings tossed in tangy sauce, served with blue cheese dip', imageUrl: '/images/chicken_wings.png' },
  { id: '3', name: 'Soup of the Day', price: 199, category: 'Starter', description: "Chef's special soup made with fresh seasonal ingredients, served with toasted sourdough", imageUrl: '/images/gourmet_soup.png' },
  { id: '4', name: 'Classic Burger', price: 299, category: 'Main', description: 'Juicy gourmet patty with aged cheddar, lettuce, tomato, and truffle aioli in a brioche bun', imageUrl: '/images/classic_burger.png' },
  { id: '5', name: 'Margherita Pizza', price: 449, category: 'Main', description: 'Artisan thin crust with San Marzano tomato sauce, fresh buffalo mozzarella and basil', imageUrl: '/images/margherita_pizza.png' },
  { id: '6', name: 'Butter Chicken', price: 429, category: 'Main', description: 'Tender tandoori chicken in a rich, creamy tomato gravy, served with butter naan', imageUrl: '/images/butter_chicken.png' },
  { id: '7', name: 'Pasta Arrabbiata', price: 379, category: 'Main', description: 'Penne in a spicy San Marzano tomato sauce, finished with parmesan and fresh herbs', imageUrl: '/images/pasta_arrabbiata.png' },
  { id: '8', name: 'Grilled Salmon', price: 699, category: 'Main', description: 'Atlantic salmon fillet with lemon butter sauce, served with truffle mash and seasonal asparagus', imageUrl: '/images/grilled_salmon.png' },
  { id: '9', name: 'Loaded Fries', price: 199, category: 'Side', description: 'Crispy golden fries topped with artisan cheese sauce, jalapenos and spring onions', imageUrl: '/images/loaded_fries.png' },
  { id: '10', name: 'Garlic Bread', price: 149, category: 'Side', description: 'Toasted artisan sourdough with herb butter and roasted garlic, served warm', imageUrl: '/images/garlic_bread.png' },
  { id: '11', name: 'Gulab Jamun', price: 179, category: 'Dessert', description: 'Soft milk-solid dumplings soaked in saffron-infused rose syrup, served warm', imageUrl: '/images/gulab_jamun.png' },
  { id: '12', name: 'Chocolate Lava Cake', price: 249, category: 'Dessert', description: 'Decadent chocolate cake with molten center, served with Madagascan vanilla ice cream', imageUrl: '/images/lava_cake.png' },
  { id: '13', name: 'Fresh Lime Soda', price: 99, category: 'Drink', description: 'Refreshing artisanal lime soda with fresh mint and a hint of Himalayan pink salt', imageUrl: '/images/lime_soda.png' },
  { id: '14', name: 'Mango Lassi', price: 149, category: 'Drink', description: 'Premium Alfonso mango yogurt smoothie with cardamom and crushed pistachios', imageUrl: '/images/mango_lassi.png' },
  { id: '15', name: 'Cold Coffee', price: 199, category: 'Drink', description: 'Rich espresso blended with chilled milk and topped with artisanal chocolate shavings', imageUrl: '/images/cold_coffee.png' }
];

export async function initDb() {
  const client = await pool.connect();
  try {
    // 1. Create tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id BIGSERIAL PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL,
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'AVAILABLE',
        current_order_id VARCHAR(255),
        capacity INTEGER DEFAULT 4
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        image_url VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        table_number INTEGER NOT NULL,
        items_json TEXT NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auth_tokens (
        token VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Seed Users
    const userRes = await client.query('SELECT COUNT(*) FROM app_users;');
    if (parseInt(userRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO app_users (username, password, role) VALUES
        ($1, $2, $3),
        ($4, $5, $6),
        ($7, $8, $9);
      `, [
        'admin', 'admin123', 'MANAGER',
        'waiter', 'waiter123', 'WAITER',
        'kitchen', 'kitchen123', 'KITCHEN'
      ]);
      console.log('✓ Seeded default users in Supabase (admin, waiter, kitchen)');
    }

    // 3. Seed Tables
    const tableRes = await client.query('SELECT COUNT(*) FROM restaurant_tables;');
    if (parseInt(tableRes.rows[0].count, 10) === 0) {
      for (let i = 1; i <= 10; i++) {
        await client.query(
          'INSERT INTO restaurant_tables (number, name, status, capacity) VALUES ($1, $2, $3, $4);',
          [i, `Table ${i}`, 'AVAILABLE', 4]
        );
      }
      console.log('✓ Seeded 10 restaurant tables in Supabase');
    }

    // 4. Seed Menu Items
    const menuRes = await client.query('SELECT COUNT(*) FROM menu_items;');
    if (parseInt(menuRes.rows[0].count, 10) === 0) {
      for (const item of INITIAL_MENU) {
        await client.query(
          'INSERT INTO menu_items (id, name, price, category, description, image_url) VALUES ($1, $2, $3, $4, $5, $6);',
          [item.id, item.name, item.price, item.category, item.description, item.imageUrl]
        );
      }
      console.log('✓ Seeded 15 menu items in Supabase');
    }

    console.log('✓ Connected and synchronized with Supabase PostgreSQL');
  } finally {
    client.release();
  }
}

function formatTable(row) {
  if (!row) return null;
  return {
    id: `t${row.number}`,
    number: row.number,
    name: row.name || `Table ${row.number}`,
    status: row.status || 'AVAILABLE',
    currentOrderId: row.current_order_id || null,
    capacity: row.capacity || 4
  };
}

function formatOrder(row) {
  if (!row) return null;
  let items = [];
  try {
    items = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : (row.items_json || []);
  } catch {
    items = [];
  }
  return {
    id: row.id,
    tableNumber: row.table_number,
    items,
    totalPrice: parseFloat(row.total_price),
    status: row.status,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp
  };
}

function formatMenuItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    category: row.category,
    description: row.description,
    imageUrl: row.image_url
  };
}

export const db = {
  // Auth & Users
  async findUser(username, password) {
    const res = await pool.query(
      'SELECT id, username, password, role FROM app_users WHERE username = $1 AND password = $2;',
      [username, password]
    );
    return res.rows[0] || null;
  },

  async createToken(user) {
    const token = crypto.randomUUID();
    await pool.query(
      'INSERT INTO auth_tokens (token, username, role) VALUES ($1, $2, $3);',
      [token, user.username, user.role]
    );
    return token;
  },

  async getUserByToken(token) {
    if (!token) return null;
    const res = await pool.query(
      'SELECT username, role FROM auth_tokens WHERE token = $1;',
      [token]
    );
    return res.rows[0] || null;
  },

  async removeToken(token) {
    if (!token) return;
    await pool.query('DELETE FROM auth_tokens WHERE token = $1;', [token]);
  },

  // Tables
  async getTables() {
    const res = await pool.query('SELECT * FROM restaurant_tables ORDER BY number ASC;');
    return res.rows.map(formatTable);
  },

  async getTableByNumber(number) {
    const res = await pool.query('SELECT * FROM restaurant_tables WHERE number = $1;', [parseInt(number, 10)]);
    return formatTable(res.rows[0]);
  },

  async addTable(number, capacity = 4) {
    const num = parseInt(number, 10);
    const existing = await this.getTableByNumber(num);
    if (existing) return null;

    const res = await pool.query(
      'INSERT INTO restaurant_tables (number, name, status, capacity) VALUES ($1, $2, $3, $4) RETURNING *;',
      [num, `Table ${num}`, 'AVAILABLE', parseInt(capacity, 10) || 4]
    );
    return formatTable(res.rows[0]);
  },

  async deleteTable(number) {
    const num = parseInt(number, 10);
    const res = await pool.query('DELETE FROM restaurant_tables WHERE number = $1 RETURNING number;', [num]);
    return res.rowCount > 0;
  },

  async freeTable(number) {
    const num = parseInt(number, 10);
    const res = await pool.query(
      'UPDATE restaurant_tables SET status = $1, current_order_id = NULL WHERE number = $2 RETURNING *;',
      ['AVAILABLE', num]
    );
    return formatTable(res.rows[0]);
  },

  async updateTableStatus(number, status, currentOrderId = undefined) {
    const num = parseInt(number, 10);
    let res;
    if (currentOrderId !== undefined) {
      res = await pool.query(
        'UPDATE restaurant_tables SET status = $1, current_order_id = $2 WHERE number = $3 RETURNING *;',
        [status, currentOrderId, num]
      );
    } else {
      res = await pool.query(
        'UPDATE restaurant_tables SET status = $1 WHERE number = $2 RETURNING *;',
        [status, num]
      );
    }
    return formatTable(res.rows[0]);
  },

  // Menu
  async getMenu() {
    const res = await pool.query('SELECT * FROM menu_items ORDER BY CAST(id AS INTEGER) ASC;');
    return res.rows.map(formatMenuItem);
  },

  async addMenuItem(item) {
    const id = item.id || crypto.randomUUID();
    const res = await pool.query(
      'INSERT INTO menu_items (id, name, price, category, description, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;',
      [id, item.name, item.price, item.category, item.description || '', item.imageUrl || '']
    );
    return formatMenuItem(res.rows[0]);
  },

  // Orders
  async getAllOrders() {
    const res = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC;');
    return res.rows.map(formatOrder);
  },

  async getActiveOrders() {
    const res = await pool.query('SELECT * FROM orders WHERE status != $1 ORDER BY timestamp ASC;', ['PAID']);
    return res.rows.map(formatOrder);
  },

  async getOrderById(id) {
    const res = await pool.query('SELECT * FROM orders WHERE id = $1;', [id]);
    return formatOrder(res.rows[0]);
  },

  async placeOrder(tableNumber, items) {
    const num = parseInt(tableNumber, 10);
    const id = crypto.randomUUID();
    const totalPrice = (items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsJson = JSON.stringify(items || []);

    const res = await pool.query(
      'INSERT INTO orders (id, table_number, items_json, total_price, status, timestamp) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *;',
      [id, num, itemsJson, totalPrice, 'PLACED']
    );

    // Update table status to OCCUPIED
    await this.updateTableStatus(num, 'OCCUPIED', id);

    return formatOrder(res.rows[0]);
  },

  async updateOrderStatus(orderId, status) {
    const res = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *;',
      [status, orderId]
    );
    if (!res.rows[0]) return null;

    const order = formatOrder(res.rows[0]);

    if (status === 'PAID') {
      await this.freeTable(order.tableNumber);
    }

    return order;
  },

  // Daily Insights
  async getDailyInsights(targetDateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateStr = targetDateStr || todayStr;

    // Fetch orders where timestamp matches dateStr
    const res = await pool.query(
      "SELECT * FROM orders WHERE TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') = $1;",
      [dateStr]
    );

    const orders = res.rows.map(formatOrder);
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'PAID' || o.status === 'SERVED').length;

    const itemCounts = {};
    for (const order of orders) {
      for (const item of (order.items || [])) {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
      }
    }

    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const ordersByStatus = {};
    for (const order of orders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    return {
      date: dateStr,
      totalRevenue,
      totalOrders,
      completedOrders,
      topItems,
      ordersByStatus,
      orders
    };
  }
};
