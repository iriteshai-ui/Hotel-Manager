import { pool } from './db.js';
import crypto from 'crypto';
import { initRbacSchema } from './rbacDb.js';

export async function initMultiTenantSchema() {
  const client = await pool.connect();
  try {
    // 1. Alter existing tables if needed
    await client.query(`
      ALTER TABLE app_users ADD COLUMN IF NOT EXISTS hotel_id UUID;
      ALTER TABLE app_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
      ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';

      ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS hotel_id UUID;
      ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS user_id BIGINT;

      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS owner_id BIGINT;
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 0;

      -- 2. Hotel Rooms Table
      CREATE TABLE IF NOT EXISTS hotel_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        room_number VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price_per_night NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'AVAILABLE',
        floor INTEGER DEFAULT 1,
        amenities TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hotel_id, room_number)
      );

      -- 3. Hotel Bookings Table
      CREATE TABLE IF NOT EXISTS hotel_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        booking_code VARCHAR(50) NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255),
        guest_phone VARCHAR(50),
        room_id UUID REFERENCES hotel_rooms(id) ON DELETE SET NULL,
        room_number VARCHAR(50),
        room_category VARCHAR(100),
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        paid_amount NUMERIC(10, 2) DEFAULT 0,
        payment_status VARCHAR(50) DEFAULT 'UNPAID',
        booking_status VARCHAR(50) DEFAULT 'CONFIRMED',
        booking_source VARCHAR(50) DEFAULT 'DIRECT',
        payment_method VARCHAR(50) DEFAULT 'CARD',
        discount_amount NUMERIC(10, 2) DEFAULT 0,
        tax_amount NUMERIC(10, 2) DEFAULT 0,
        refund_amount NUMERIC(10, 2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. Hotel Transactions / Financials
      CREATE TABLE IF NOT EXISTS hotel_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES hotel_bookings(id) ON DELETE SET NULL,
        amount NUMERIC(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'CARD',
        status VARCHAR(50) DEFAULT 'COMPLETED',
        description TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      -- 5. Hotel Customers Table
      CREATE TABLE IF NOT EXISTS hotel_customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        total_bookings INTEGER DEFAULT 1,
        total_spent NUMERIC(10, 2) DEFAULT 0,
        last_visit DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 6. Hotel Staff & Operations
      CREATE TABLE IF NOT EXISTS hotel_staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        shift VARCHAR(50) DEFAULT 'MORNING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 7. System Audit Logs
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        hotel_id UUID,
        user_id BIGINT,
        username VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        ip_address VARCHAR(100),
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Seed Sample Hotels: Hotel A (Grand Horizon Resort) and Hotel B (The Royal Palms)
    const hotelACheck = await client.query("SELECT id FROM hotels WHERE slug = 'grand-horizon';");
    let hotelAId;
    if (hotelACheck.rows.length === 0) {
      const hARes = await client.query(`
        INSERT INTO hotels (name, slug, currency, tax_percentage, theme, contact_email, contact_phone, status, total_rooms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        'Grand Horizon Resort',
        'grand-horizon',
        'USD',
        12.00,
        JSON.stringify({ primaryColor: '#2563EB', backgroundColor: '#0F172A', borderRadius: '14px' }),
        'concierge@grandhorizon.com',
        '+1 (555) 349-2041',
        'ACTIVE',
        10
      ]);
      hotelAId = hARes.rows[0].id;
    } else {
      hotelAId = hotelACheck.rows[0].id;
    }

    const hotelBCheck = await client.query("SELECT id FROM hotels WHERE slug = 'royal-palms';");
    let hotelBId;
    if (hotelBCheck.rows.length === 0) {
      const hBRes = await client.query(`
        INSERT INTO hotels (name, slug, currency, tax_percentage, theme, contact_email, contact_phone, status, total_rooms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        'The Royal Palms',
        'royal-palms',
        'EUR',
        10.00,
        JSON.stringify({ primaryColor: '#059669', backgroundColor: '#0F172A', borderRadius: '12px' }),
        'stay@royalpalms.com',
        '+33 1 42 68 55 00',
        'ACTIVE',
        8
      ]);
      hotelBId = hBRes.rows[0].id;
    } else {
      hotelBId = hotelBCheck.rows[0].id;
    }

    const hotelLCheck = await client.query("SELECT id FROM hotels WHERE slug = 'laybhari';");
    let hotelLaybhariId;
    if (hotelLCheck.rows.length === 0) {
      const hLRes = await client.query(`
        INSERT INTO hotels (name, slug, currency, tax_percentage, theme, contact_email, contact_phone, status, total_rooms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        'Hotel Lay Bhari',
        'laybhari',
        'INR',
        5.00,
        JSON.stringify({ primaryColor: '#D97706', backgroundColor: '#0F172A', borderRadius: '14px' }),
        'contact@hotellaybhari.com',
        '+91 98765 43210',
        'ACTIVE',
        12
      ]);
      hotelLaybhariId = hLRes.rows[0].id;
    } else {
      hotelLaybhariId = hotelLCheck.rows[0].id;
    }

    // 9. Seed Core Users (Super Admin, Hotel A Owner, Hotel B Owner, Hotel Lay Bhari Owner)
    await client.query(`
      INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
      VALUES 
        ('superadmin', 'super123', 'SUPER_ADMIN', NULL, 'Alexander Vance (Super Admin)', 'admin@auraplatform.com', 'ACTIVE')
      ON CONFLICT (username) DO UPDATE 
        SET role = 'SUPER_ADMIN', full_name = 'Alexander Vance (Super Admin)';
    `);

    await client.query(`
      INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
      VALUES 
        ('owner_hotela', 'password123', 'HOTEL_OWNER', $1, 'Julian Montgomery (Hotel A Owner)', 'owner@grandhorizon.com', 'ACTIVE')
      ON CONFLICT (username) DO UPDATE 
        SET role = 'HOTEL_OWNER', hotel_id = $1, full_name = 'Julian Montgomery (Hotel A Owner)';
    `, [hotelAId]);

    await client.query(`
      INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
      VALUES 
        ('owner_hotelb', 'password123', 'HOTEL_OWNER', $1, 'Claire Delacroix (Hotel B Owner)', 'owner@royalpalms.com', 'ACTIVE')
      ON CONFLICT (username) DO UPDATE 
        SET role = 'HOTEL_OWNER', hotel_id = $1, full_name = 'Claire Delacroix (Hotel B Owner)';
    `, [hotelBId]);

    await client.query(`
      INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
      VALUES 
        ('owner_laybhari', 'password123', 'HOTEL_OWNER', $1, 'Tanaji Rao (Hotel Lay Bhari Owner)', 'owner@hotellaybhari.com', 'ACTIVE')
      ON CONFLICT (username) DO UPDATE 
        SET role = 'HOTEL_OWNER', hotel_id = $1, full_name = 'Tanaji Rao (Hotel Lay Bhari Owner)';
    `, [hotelLaybhariId]);

    // 10. Seed Rooms for Hotel A if none exist
    const roomsACheck = await client.query('SELECT COUNT(*) FROM hotel_rooms WHERE hotel_id = $1;', [hotelAId]);
    if (parseInt(roomsACheck.rows[0].count, 10) === 0) {
      const hotelARooms = [
        { num: '101', cat: 'Standard Room', price: 180, status: 'OCCUPIED', floor: 1, amenities: ['King Bed', 'City View', 'Wi-Fi'] },
        { num: '102', cat: 'Standard Room', price: 180, status: 'AVAILABLE', floor: 1, amenities: ['King Bed', 'Wi-Fi'] },
        { num: '201', cat: 'Deluxe Suite', price: 290, status: 'OCCUPIED', floor: 2, amenities: ['Ocean View', 'Balcony', 'Mini Bar'] },
        { num: '202', cat: 'Deluxe Suite', price: 290, status: 'AVAILABLE', floor: 2, amenities: ['Ocean View', 'Balcony', 'Mini Bar'] },
        { num: '301', cat: 'Executive Suite', price: 420, status: 'OCCUPIED', floor: 3, amenities: ['Jacuzzi', 'Ocean View', 'Butler Service'] }, 
        { num: '302', cat: 'Executive Suite', price: 420, status: 'RESERVED', floor: 3, amenities: ['Jacuzzi', 'Ocean View', 'Butler Service'] },
        { num: '401', cat: 'Presidential Penthouse', price: 850, status: 'OCCUPIED', floor: 4, amenities: ['Private Terrace', 'Plunge Pool', 'Personal Chef'] },
        { num: '402', cat: 'Deluxe Suite', price: 310, status: 'AVAILABLE', floor: 4, amenities: ['Terrace', 'Mini Bar'] },
        { num: '103', cat: 'Standard Room', price: 180, status: 'MAINTENANCE', floor: 1, amenities: ['Queen Bed', 'Wi-Fi'] },
        { num: '104', cat: 'Standard Room', price: 190, status: 'AVAILABLE', floor: 1, amenities: ['Garden View', 'Wi-Fi'] },
      ];

      for (const r of hotelARooms) {
        await client.query(`
          INSERT INTO hotel_rooms (hotel_id, room_number, category, price_per_night, status, floor, amenities)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (hotel_id, room_number) DO NOTHING;
        `, [hotelAId, r.num, r.cat, r.price, r.status, r.floor, r.amenities]);
      }
    }

    // 11. Seed Rooms for Hotel B if none exist
    const roomsBCheck = await client.query('SELECT COUNT(*) FROM hotel_rooms WHERE hotel_id = $1;', [hotelBId]);
    if (parseInt(roomsBCheck.rows[0].count, 10) === 0) {
      const hotelBRooms = [
        { num: 'B101', cat: 'Standard Queen', price: 160, status: 'OCCUPIED', floor: 1, amenities: ['Courtyard View', 'Wi-Fi'] },
        { num: 'B102', cat: 'Standard Queen', price: 160, status: 'AVAILABLE', floor: 1, amenities: ['Courtyard View', 'Wi-Fi'] },
        { num: 'B201', cat: 'Palace Suite', price: 340, status: 'OCCUPIED', floor: 2, amenities: ['Champs-Élysées View', 'Espresso Bar'] },
        { num: 'B202', cat: 'Palace Suite', price: 340, status: 'AVAILABLE', floor: 2, amenities: ['Balcony', 'Espresso Bar'] },
        { num: 'B301', cat: 'Royal Penthouse', price: 620, status: 'OCCUPIED', floor: 3, amenities: ['Private Sauna', 'Terrace', 'Concierge'] },
        { num: 'B302', cat: 'Standard Queen', price: 170, status: 'RESERVED', floor: 3, amenities: ['Wi-Fi', 'Smart TV'] },
        { num: 'B203', cat: 'Palace Suite', price: 340, status: 'AVAILABLE', floor: 2, amenities: ['Balcony'] },
        { num: 'B103', cat: 'Standard Queen', price: 160, status: 'MAINTENANCE', floor: 1, amenities: ['Courtyard View'] },
      ];

      for (const r of hotelBRooms) {
        await client.query(`
          INSERT INTO hotel_rooms (hotel_id, room_number, category, price_per_night, status, floor, amenities)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (hotel_id, room_number) DO NOTHING;
        `, [hotelBId, r.num, r.cat, r.price, r.status, r.floor, r.amenities]);
      }
    }

    // 12. Seed Bookings for Hotel A if none exist
    const bookingsACheck = await client.query('SELECT COUNT(*) FROM hotel_bookings WHERE hotel_id = $1;', [hotelAId]);
    if (parseInt(bookingsACheck.rows[0].count, 10) === 0) {
      const sampleBookingsA = [
        { code: 'BK-HA-101', guest: 'Sir Marcus Sterling', email: 'marcus@sterlingcapital.com', phone: '+1 555-892-1049', roomNum: '401', cat: 'Presidential Penthouse', checkIn: '2026-11-17', checkOut: '2026-11-21', total: 3400, paid: 3400, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'DIRECT', method: 'ONLINE', disc: 0, tax: 408 },
        { code: 'BK-HA-102', guest: 'Dr. Evelyn Reed', email: 'e.reed@oxfordalumni.org', phone: '+1 555-481-9921', roomNum: '301', cat: 'Executive Suite', checkIn: '2026-11-18', checkOut: '2026-11-22', total: 1680, paid: 1680, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'OTA_BOOKING', method: 'CARD', disc: 50, tax: 201.6 },
        { code: 'BK-HA-103', guest: 'David & Rachel Chen', email: 'dchen@techcorp.io', phone: '+1 555-321-4478', roomNum: '201', cat: 'Deluxe Suite', checkIn: '2026-11-16', checkOut: '2026-11-19', total: 870, paid: 870, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'WEBSITE', method: 'CARD', disc: 0, tax: 104.4 },
        { code: 'BK-HA-104', guest: 'Jonathan Hayes', email: 'j.hayes@apexventures.com', phone: '+1 555-912-3847', roomNum: '101', cat: 'Standard Room', checkIn: '2026-11-18', checkOut: '2026-11-20', total: 360, paid: 360, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'WALK_IN', method: 'CASH', disc: 0, tax: 43.2 },
        { code: 'BK-HA-105', guest: 'Lady Victoria Sinclair', email: 'v.sinclair@heritage.co.uk', phone: '+44 20 7946 0912', roomNum: '302', cat: 'Executive Suite', checkIn: '2026-11-19', checkOut: '2026-11-25', total: 2520, paid: 1000, pStatus: 'PARTIAL', bStatus: 'CONFIRMED', source: 'DIRECT', method: 'ONLINE', disc: 100, tax: 302.4 },
        { code: 'BK-HA-106', guest: 'Arthur Pendelton', email: 'arthur.p@voyages.com', phone: '+1 555-773-1940', roomNum: '102', cat: 'Standard Room', checkIn: '2026-11-10', checkOut: '2026-11-14', total: 720, paid: 720, pStatus: 'PAID', bStatus: 'COMPLETED', source: 'OTA_BOOKING', method: 'CARD', disc: 0, tax: 86.4 },
        { code: 'BK-HA-107', guest: 'Miriam Al-Mansoor', email: 'miriam@almansoor.ae', phone: '+971 50 123 4567', roomNum: '202', cat: 'Deluxe Suite', checkIn: '2026-11-05', checkOut: '2026-11-09', total: 1160, paid: 1160, pStatus: 'PAID', bStatus: 'COMPLETED', source: 'DIRECT', method: 'ONLINE', disc: 0, tax: 139.2 },
        { code: 'BK-HA-108', guest: 'Robert Fox', email: 'rfox@travelnow.com', phone: '+1 555-334-9012', roomNum: '103', cat: 'Standard Room', checkIn: '2026-11-15', checkOut: '2026-11-17', total: 360, paid: 0, pStatus: 'REFUNDED', bStatus: 'CANCELLED', source: 'OTA_BOOKING', method: 'ONLINE', disc: 0, tax: 0, refund: 360 },
      ];

      for (const b of sampleBookingsA) {
        await client.query(`
          INSERT INTO hotel_bookings (
            hotel_id, booking_code, guest_name, guest_email, guest_phone, room_number, room_category,
            check_in, check_out, total_amount, paid_amount, payment_status, booking_status, booking_source,
            payment_method, discount_amount, tax_amount, refund_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
        `, [
          hotelAId, b.code, b.guest, b.email, b.phone, b.roomNum, b.cat,
          b.checkIn, b.checkOut, b.total, b.paid, b.pStatus, b.bStatus, b.source,
          b.method, b.disc || 0, b.tax || 0, b.refund || 0
        ]);
      }
    }

    // 13. Seed Bookings for Hotel B if none exist
    const bookingsBCheck = await client.query('SELECT COUNT(*) FROM hotel_bookings WHERE hotel_id = $1;', [hotelBId]);
    if (parseInt(bookingsBCheck.rows[0].count, 10) === 0) {
      const sampleBookingsB = [
        { code: 'BK-HB-201', guest: 'Jean-Luc Picard', email: 'jluc@starlight.fr', phone: '+33 6 12 34 56 78', roomNum: 'B301', cat: 'Royal Penthouse', checkIn: '2026-11-17', checkOut: '2026-11-20', total: 1860, paid: 1860, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'DIRECT', method: 'CARD', disc: 0, tax: 186 },
        { code: 'BK-HB-202', guest: 'Camille Dupont', email: 'c.dupont@parisienne.fr', phone: '+33 6 98 76 54 32', roomNum: 'B201', cat: 'Palace Suite', checkIn: '2026-11-18', checkOut: '2026-11-21', total: 1020, paid: 1020, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'WEBSITE', method: 'ONLINE', disc: 50, tax: 102 },
        { code: 'BK-HB-203', guest: 'Henri Moreau', email: 'henri@moreau-wine.com', phone: '+33 6 55 44 33 22', roomNum: 'B101', cat: 'Standard Queen', checkIn: '2026-11-16', checkOut: '2026-11-19', total: 480, paid: 480, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'WALK_IN', method: 'CASH', disc: 0, tax: 48 },
        { code: 'BK-HB-204', guest: 'Monique Beaulieu', email: 'monique@luxetravel.be', phone: '+32 2 555 0192', roomNum: 'B202', cat: 'Palace Suite', checkIn: '2026-11-12', checkOut: '2026-11-15', total: 1020, paid: 1020, pStatus: 'PAID', bStatus: 'COMPLETED', source: 'OTA_BOOKING', method: 'CARD', disc: 0, tax: 102 },
      ];

      for (const b of sampleBookingsB) {
        await client.query(`
          INSERT INTO hotel_bookings (
            hotel_id, booking_code, guest_name, guest_email, guest_phone, room_number, room_category,
            check_in, check_out, total_amount, paid_amount, payment_status, booking_status, booking_source,
            payment_method, discount_amount, tax_amount, refund_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
        `, [
          hotelBId, b.code, b.guest, b.email, b.phone, b.roomNum, b.cat,
          b.checkIn, b.checkOut, b.total, b.paid, b.pStatus, b.bStatus, b.source,
          b.method, b.disc || 0, b.tax || 0, b.refund || 0
        ]);
      }
    }

    // 14. Seed Staff for Hotel A & B
    const staffACheck = await client.query('SELECT COUNT(*) FROM hotel_staff WHERE hotel_id = $1;', [hotelAId]);
    if (parseInt(staffACheck.rows[0].count, 10) === 0) {
      const staffA = [
        { name: 'Elena Rostov', role: 'Front Desk Manager', email: 'elena@grandhorizon.com', phone: '+1 555-0192', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Marcus Thorne', role: 'Head Concierge', email: 'marcus.t@grandhorizon.com', phone: '+1 555-0193', status: 'ACTIVE', shift: 'EVENING' },
        { name: 'Aaliyah Patel', role: 'Housekeeping Lead', email: 'aaliyah@grandhorizon.com', phone: '+1 555-0194', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Chef Jean-Luc', role: 'Executive Chef', email: 'chef@grandhorizon.com', phone: '+1 555-0195', status: 'ACTIVE', shift: 'EVENING' },
        { name: 'Liam O’Connor', role: 'Maintenance Engineer', email: 'liam@grandhorizon.com', phone: '+1 555-0196', status: 'ON_LEAVE', shift: 'NIGHT' },
      ];
      for (const s of staffA) {
        await client.query(`
          INSERT INTO hotel_staff (hotel_id, name, role, email, phone, status, shift)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [hotelAId, s.name, s.role, s.email, s.phone, s.status, s.shift]);
      }
    }

    const staffBCheck = await client.query('SELECT COUNT(*) FROM hotel_staff WHERE hotel_id = $1;', [hotelBId]);
    if (parseInt(staffBCheck.rows[0].count, 10) === 0) {
      const staffB = [
        { name: 'Mathieu Blanc', role: 'Directeur Général', email: 'mathieu@royalpalms.com', phone: '+33 1 42 68 55 01', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Amélie Vernier', role: 'Chef de Réception', email: 'amelie@royalpalms.com', phone: '+33 1 42 68 55 02', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Thierry Laurent', role: 'Gouvernante Générale', email: 'thierry@royalpalms.com', phone: '+33 1 42 68 55 03', status: 'ACTIVE', shift: 'EVENING' },
      ];
      for (const s of staffB) {
        await client.query(`
          INSERT INTO hotel_staff (hotel_id, name, role, email, phone, status, shift)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [hotelBId, s.name, s.role, s.email, s.phone, s.status, s.shift]);
      }
    }

    // 15. Seed Initial Audit Logs
    const auditCheck = await client.query('SELECT COUNT(*) FROM system_audit_logs;');
    if (parseInt(auditCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO system_audit_logs (hotel_id, username, action, resource, details)
        VALUES 
          (NULL, 'superadmin', 'INITIALIZE_PLATFORM', 'PLATFORM', '{"description":"Multi-tenant security core provisioned"}'::jsonb),
          ($1, 'superadmin', 'PROVISION_HOTEL', 'HOTEL', '{"hotel":"Grand Horizon Resort","slug":"grand-horizon"}'::jsonb),
          ($2, 'superadmin', 'PROVISION_HOTEL', 'HOTEL', '{"hotel":"The Royal Palms","slug":"royal-palms"}'::jsonb),
          ($1, 'owner_hotela', 'LOGIN', 'SESSION', '{"ip":"127.0.0.1","userAgent":"Browser/Desktop"}'::jsonb),
          ($2, 'owner_hotelb', 'LOGIN', 'SESSION', '{"ip":"127.0.0.1","userAgent":"Browser/Desktop"}'::jsonb);
      `, [hotelAId, hotelBId]);
    }

    console.log('✓ Multi-Tenant Schema & Sample Hotels (A & B) Initialized Successfully!');
    // Initialize RBAC Schema, Default Roles, Modules, Permissions & User Mappings
    await initRbacSchema();
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-TENANT QUERY METHODS
// ─────────────────────────────────────────────────────────────────────────────

export const multiTenantDb = {
  // Audit logger
  async logAudit(hotelId, userId, username, action, resource, details = {}, ip = '127.0.0.1') {
    try {
      await pool.query(
        `INSERT INTO system_audit_logs (hotel_id, user_id, username, action, resource, details, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
        [hotelId || null, userId || null, username || 'system', action, resource, JSON.stringify(details), ip]
      );
    } catch (e) {
      console.error('Audit log write error:', e.message);
    }
  },

  // ── SUPER ADMIN QUERIES (Platform-Wide) ──
  async getSuperAdminOverview() {
    // 1. Hotels metrics
    const hotelsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_hotels,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_hotels,
        COUNT(*) FILTER (WHERE status != 'ACTIVE') as inactive_hotels
      FROM hotels;
    `);

    // 2. Users metric
    const usersRes = await pool.query('SELECT COUNT(*) as total_users FROM app_users;');

    // 3. Rooms metric
    const roomsRes = await pool.query('SELECT COUNT(*) as total_rooms FROM hotel_rooms;');

    // 4. Bookings & Sales across platform
    const bookingsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as total_revenue,
        COALESCE(SUM(paid_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as total_collections
      FROM hotel_bookings;
    `);

    // 5. Hotel-wise performance comparison
    const performanceRes = await pool.query(`
      SELECT 
        h.id, h.name, h.slug, h.currency, h.status, h.created_at,
        u.username as owner_username, u.full_name as owner_name,
        COUNT(DISTINCT r.id) as rooms_count,
        COUNT(DISTINCT b.id) as bookings_count,
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.booking_status != 'CANCELLED'), 0) as total_sales,
        ROUND(
          COALESCE(
            (COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'OCCUPIED')::numeric / 
             NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
            0
          ), 1
        ) as occupancy_rate
      FROM hotels h
      LEFT JOIN app_users u ON h.id = u.hotel_id AND u.role = 'HOTEL_OWNER'
      LEFT JOIN hotel_rooms r ON h.id = r.hotel_id
      LEFT JOIN hotel_bookings b ON h.id = b.hotel_id
      GROUP BY h.id, h.name, h.slug, h.currency, h.status, h.created_at, u.username, u.full_name
      ORDER BY total_sales DESC;
    `);

    // 6. Monthly revenue trends across platform (last 6 months)
    const trendsRes = await pool.query(`
      SELECT 
        TO_CHAR(check_in, 'Mon YYYY') as month,
        DATE_TRUNC('month', check_in) as sort_date,
        COUNT(*) as bookings_count,
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as revenue
      FROM hotel_bookings
      GROUP BY TO_CHAR(check_in, 'Mon YYYY'), DATE_TRUNC('month', check_in)
      ORDER BY sort_date ASC
      LIMIT 12;
    `);

    // 7. Recent hotels registered
    const recentHotelsRes = await pool.query(`
      SELECT h.id, h.name, h.slug, h.currency, h.status, h.contact_email, h.contact_phone, h.created_at,
             COUNT(DISTINCT r.id) as rooms_count
      FROM hotels h
      LEFT JOIN hotel_rooms r ON h.id = r.hotel_id
      GROUP BY h.id
      ORDER BY h.created_at DESC
      LIMIT 5;
    `);

    // 8. Recent Audit Logs
    const auditRes = await pool.query(`
      SELECT a.*, h.name as hotel_name
      FROM system_audit_logs a
      LEFT JOIN hotels h ON a.hotel_id = h.id
      ORDER BY a.timestamp DESC
      LIMIT 10;
    `);

    const h = hotelsRes.rows[0];
    const b = bookingsRes.rows[0];

    return {
      totalHotels: parseInt(h.total_hotels, 10),
      activeHotels: parseInt(h.active_hotels, 10),
      inactiveHotels: parseInt(h.inactive_hotels, 10),
      totalUsers: parseInt(usersRes.rows[0].total_users, 10),
      totalRooms: parseInt(roomsRes.rows[0].total_rooms, 10),
      totalBookings: parseInt(b.total_bookings, 10),
      totalRevenue: parseFloat(b.total_revenue),
      totalCollections: parseFloat(b.total_collections),
      hotelPerformance: performanceRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        currency: row.currency,
        status: row.status,
        ownerUsername: row.owner_username,
        ownerName: row.owner_name,
        roomsCount: parseInt(row.rooms_count, 10),
        bookingsCount: parseInt(row.bookings_count, 10),
        totalSales: parseFloat(row.total_sales),
        occupancyRate: parseFloat(row.occupancy_rate)
      })),
      monthlyRevenueTrends: trendsRes.rows.map(r => ({
        month: r.month,
        bookings: parseInt(r.bookings_count, 10),
        revenue: parseFloat(r.revenue)
      })),
      recentHotels: recentHotelsRes.rows,
      auditLogs: auditRes.rows
    };
  },

  async getAllHotels() {
    const res = await pool.query(`
      SELECT 
        h.*,
        u.id as owner_user_id, u.username as owner_username, u.full_name as owner_name, u.email as owner_email,
        COUNT(DISTINCT r.id) as rooms_count,
        COUNT(DISTINCT b.id) as bookings_count,
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.booking_status != 'CANCELLED'), 0) as total_sales
      FROM hotels h
      LEFT JOIN app_users u ON h.id = u.hotel_id AND u.role = 'HOTEL_OWNER'
      LEFT JOIN hotel_rooms r ON h.id = r.hotel_id
      LEFT JOIN hotel_bookings b ON h.id = b.hotel_id
      GROUP BY h.id, u.id, u.username, u.full_name, u.email
      ORDER BY h.created_at DESC;
    `);
    return res.rows.map(r => ({
      ...r,
      total_sales: parseFloat(r.total_sales),
      rooms_count: parseInt(r.rooms_count, 10),
      bookings_count: parseInt(r.bookings_count, 10)
    }));
  },

  async toggleHotelStatus(hotelId, status) {
    const res = await pool.query(
      'UPDATE hotels SET status = $1 WHERE id = $2 RETURNING *;',
      [status, hotelId]
    );
    return res.rows[0] || null;
  },

  async updateHotel(hotelId, { name, currency, taxPercentage, contactEmail, contactPhone, status, totalRooms }) {
    const fields = [];
    const params = [hotelId];
    let idx = 2;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      params.push(name.trim());
    }
    if (currency !== undefined) {
      fields.push(`currency = $${idx++}`);
      params.push(currency.toUpperCase());
    }
    if (taxPercentage !== undefined) {
      fields.push(`tax_percentage = $${idx++}`);
      params.push(parseFloat(taxPercentage) || 0);
    }
    if (contactEmail !== undefined) {
      fields.push(`contact_email = $${idx++}`);
      params.push(contactEmail.trim());
    }
    if (contactPhone !== undefined) {
      fields.push(`contact_phone = $${idx++}`);
      params.push(contactPhone.trim());
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      params.push(status.toUpperCase());
    }
    if (totalRooms !== undefined) {
      fields.push(`total_rooms = $${idx++}`);
      params.push(parseInt(totalRooms, 10) || 0);
    }

    if (fields.length === 0) return null;

    const sql = `UPDATE hotels SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
  },

  async getAllUsers() {
    const res = await pool.query(`
      SELECT u.id, u.username, u.role, u.full_name, u.email, u.status, u.hotel_id,
             h.name as hotel_name, h.slug as hotel_slug
      FROM app_users u
      LEFT JOIN hotels h ON u.hotel_id = h.id
      ORDER BY u.id ASC;
    `);
    return res.rows;
  },

  // ── HOTEL OWNER QUERIES (Strictly Isolated by hotel_id) ──
  async getHotelDashboard(hotelId) {
    const hotelRes = await pool.query('SELECT * FROM hotels WHERE id = $1;', [hotelId]);
    if (hotelRes.rows.length === 0) return null;
    const hotel = hotelRes.rows[0];

    // Today's Sales
    const todaySalesRes = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as today_sales
      FROM hotel_bookings
      WHERE hotel_id = $1 
        AND DATE(created_at) = CURRENT_DATE 
        AND booking_status != 'CANCELLED';
    `, [hotelId]);

    // Total and Monthly Revenue
    const revenueRes = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (
          WHERE booking_status != 'CANCELLED' 
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0) as monthly_revenue,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(SUM(refund_amount), 0) as total_refunds,
        COALESCE(SUM(paid_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as total_collections
      FROM hotel_bookings
      WHERE hotel_id = $1;
    `, [hotelId]);

    // Check-ins & Check-outs for Today
    const checkInOutRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE check_in = CURRENT_DATE AND booking_status = 'CONFIRMED') as today_checkins,
        COUNT(*) FILTER (WHERE check_out = CURRENT_DATE AND booking_status = 'CONFIRMED') as today_checkouts
      FROM hotel_bookings
      WHERE hotel_id = $1;
    `, [hotelId]);

    // Room Occupancy & Breakdown
    const roomsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(*) FILTER (WHERE status = 'OCCUPIED') as occupied_rooms,
        COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_rooms,
        COUNT(*) FILTER (WHERE status = 'RESERVED') as reserved_rooms,
        COUNT(*) FILTER (WHERE status = 'MAINTENANCE') as maintenance_rooms
      FROM hotel_rooms
      WHERE hotel_id = $1;
    `, [hotelId]);

    // Recent 5 Bookings for Dashboard Widget
    const recentBookingsRes = await pool.query(`
      SELECT id, booking_code, guest_name, room_number, room_category, check_in, check_out, total_amount, payment_status, booking_status
      FROM hotel_bookings
      WHERE hotel_id = $1
      ORDER BY created_at DESC
      LIMIT 6;
    `, [hotelId]);

    const rev = revenueRes.rows[0];
    const rms = roomsRes.rows[0];
    const totalRooms = parseInt(rms.total_rooms, 10);
    const occupiedRooms = parseInt(rms.occupied_rooms, 10);
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    const totalBookings = parseInt(rev.total_bookings, 10);
    const totalRevenue = parseFloat(rev.total_revenue);
    const averageRoomRevenue = totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        currency: hotel.currency,
        taxPercentage: parseFloat(hotel.tax_percentage),
        theme: typeof hotel.theme === 'string' ? JSON.parse(hotel.theme) : hotel.theme
      },
      kpis: {
        todaySales: parseFloat(todaySalesRes.rows[0].today_sales),
        totalRevenue,
        monthlyRevenue: parseFloat(rev.monthly_revenue),
        totalBookings,
        todayCheckIns: parseInt(checkInOutRes.rows[0].today_checkins, 10),
        todayCheckOuts: parseInt(checkInOutRes.rows[0].today_checkouts, 10),
        totalRooms,
        occupiedRooms,
        availableRooms: parseInt(rms.available_rooms, 10),
        reservedRooms: parseInt(rms.reserved_rooms, 10),
        maintenanceRooms: parseInt(rms.maintenance_rooms, 10),
        occupancyPercentage: parseFloat(occupancyRate),
        averageRoomRevenue: parseFloat(averageRoomRevenue)
      },
      recentBookings: recentBookingsRes.rows
    };
  },

  async getHotelAnalytics(hotelId, filter = 'last_30_days') {
    // 1. Revenue by Room Category
    const categoryRes = await pool.query(`
      SELECT 
        room_category,
        COUNT(*) as bookings_count,
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as revenue
      FROM hotel_bookings
      WHERE hotel_id = $1
      GROUP BY room_category
      ORDER BY revenue DESC;
    `, [hotelId]);

    // 2. Booking Source Breakdown
    const sourceRes = await pool.query(`
      SELECT 
        booking_source,
        COUNT(*) as count,
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as revenue
      FROM hotel_bookings
      WHERE hotel_id = $1
      GROUP BY booking_source
      ORDER BY count DESC;
    `, [hotelId]);

    // 3. Payment Method Breakdown (Cash vs Online vs Card)
    const paymentRes = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(paid_amount), 0) as total_paid
      FROM hotel_bookings
      WHERE hotel_id = $1
      GROUP BY payment_method
      ORDER BY total_paid DESC;
    `, [hotelId]);

    // 4. Daily / Monthly Revenue Trends
    const trendsRes = await pool.query(`
      SELECT 
        TO_CHAR(check_in, 'YYYY-MM-DD') as date_label,
        COUNT(*) as bookings_count,
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as daily_sales
      FROM hotel_bookings
      WHERE hotel_id = $1
      GROUP BY TO_CHAR(check_in, 'YYYY-MM-DD')
      ORDER BY date_label ASC
      LIMIT 14;
    `, [hotelId]);

    return {
      revenueByCategory: categoryRes.rows.map(r => ({
        category: r.room_category || 'Standard',
        bookings: parseInt(r.bookings_count, 10),
        revenue: parseFloat(r.revenue)
      })),
      bookingSources: sourceRes.rows.map(r => ({
        source: r.booking_source,
        count: parseInt(r.count, 10),
        revenue: parseFloat(r.revenue)
      })),
      paymentMethods: paymentRes.rows.map(r => ({
        method: r.payment_method,
        count: parseInt(r.count, 10),
        amount: parseFloat(r.total_paid)
      })),
      trends: trendsRes.rows.map(r => ({
        date: r.date_label,
        bookings: parseInt(r.bookings_count, 10),
        sales: parseFloat(r.daily_sales)
      }))
    };
  },

  async getHotelBookings(hotelId, { status, search } = {}) {
    let sql = 'SELECT * FROM hotel_bookings WHERE hotel_id = $1';
    const params = [hotelId];
    let idx = 2;

    if (status && status !== 'ALL') {
      sql += ` AND booking_status = $${idx++}`;
      params.push(status.toUpperCase());
    }

    if (search && search.trim()) {
      sql += ` AND (guest_name ILIKE $${idx} OR booking_code ILIKE $${idx} OR room_number ILIKE $${idx})`;
      params.push(`%${search.trim()}%`);
      idx++;
    }

    sql += ' ORDER BY created_at DESC;';
    const res = await pool.query(sql, params);
    return res.rows;
  },

  async createHotelBooking(hotelId, data) {
    const bookingCode = `BK-${Date.now().toString().slice(-6)}`;
    const res = await pool.query(`
      INSERT INTO hotel_bookings (
        hotel_id, booking_code, guest_name, guest_email, guest_phone, room_number, room_category,
        check_in, check_out, total_amount, paid_amount, payment_status, booking_status,
        booking_source, payment_method, discount_amount, tax_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `, [
      hotelId,
      bookingCode,
      data.guestName,
      data.guestEmail || '',
      data.guestPhone || '',
      data.roomNumber,
      data.roomCategory || 'Standard Room',
      data.checkIn,
      data.checkOut,
      parseFloat(data.totalAmount) || 0,
      parseFloat(data.paidAmount) || 0,
      data.paymentStatus || 'PAID',
      data.bookingStatus || 'CONFIRMED',
      data.bookingSource || 'DIRECT',
      data.paymentMethod || 'CARD',
      parseFloat(data.discountAmount) || 0,
      parseFloat(data.taxAmount) || 0
    ]);
    return res.rows[0];
  },

  async updateBookingStatus(hotelId, bookingId, status) {
    const res = await pool.query(`
      UPDATE hotel_bookings 
      SET booking_status = $1 
      WHERE id = $2 AND hotel_id = $3 
      RETURNING *;
    `, [status, bookingId, hotelId]);
    return res.rows[0] || null;
  },

  async getHotelRooms(hotelId) {
    const res = await pool.query(`
      SELECT * FROM hotel_rooms 
      WHERE hotel_id = $1 
      ORDER BY room_number ASC;
    `, [hotelId]);
    return res.rows;
  },

  async createHotelRoom(hotelId, { roomNumber, category, pricePerNight, floor = 1, amenities = [] }) {
    const amenitiesArr = Array.isArray(amenities)
      ? amenities
      : typeof amenities === 'string'
        ? amenities.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const res = await pool.query(`
      INSERT INTO hotel_rooms (hotel_id, room_number, category, price_per_night, status, floor, amenities)
      VALUES ($1, $2, $3, $4, 'AVAILABLE', $5, $6)
      RETURNING *;
    `, [hotelId, roomNumber, category, parseFloat(pricePerNight), parseInt(floor, 10), amenitiesArr]);
    return res.rows[0];
  },

  async updateRoomStatus(hotelId, roomId, status) {
    const res = await pool.query(`
      UPDATE hotel_rooms 
      SET status = $1 
      WHERE id = $2 AND hotel_id = $3 
      RETURNING *;
    `, [status, roomId, hotelId]);
    return res.rows[0] || null;
  },

  async getHotelCustomers(hotelId) {
    // Derive customer insights from bookings if customer records empty
    const res = await pool.query(`
      SELECT 
        guest_name as name,
        guest_email as email,
        guest_phone as phone,
        COUNT(*) as total_bookings,
        SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED') as total_spent,
        MAX(check_in) as last_visit
      FROM hotel_bookings
      WHERE hotel_id = $1
      GROUP BY guest_name, guest_email, guest_phone
      ORDER BY total_spent DESC;
    `, [hotelId]);
    return res.rows.map(r => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      totalBookings: parseInt(r.total_bookings, 10),
      totalSpent: parseFloat(r.total_spent || 0),
      lastVisit: r.last_visit
    }));
  },

  async getHotelFinancials(hotelId) {
    const res = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as gross_sales,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(SUM(refund_amount), 0) as total_refunds,
        COALESCE(SUM(tax_amount), 0) as total_taxes,
        COALESCE(SUM(paid_amount) FILTER (WHERE booking_status != 'CANCELLED'), 0) as total_collections,
        COALESCE(SUM(total_amount - paid_amount) FILTER (WHERE booking_status = 'CONFIRMED' AND total_amount > paid_amount), 0) as pending_payments
      FROM hotel_bookings
      WHERE hotel_id = $1;
    `, [hotelId]);

    const row = res.rows[0];
    const gross = parseFloat(row.gross_sales);
    const disc = parseFloat(row.total_discounts);
    const refunds = parseFloat(row.total_refunds);
    const net = gross - disc - refunds;

    return {
      grossSales: gross,
      grossRevenue: gross,
      netSales: net,
      netRevenue: net,
      totalCollections: parseFloat(row.total_collections),
      pendingPayments: parseFloat(row.pending_payments),
      totalDiscounts: disc,
      totalRefunds: refunds,
      totalTaxes: parseFloat(row.total_taxes),
      taxCollected: parseFloat(row.total_taxes)
    };
  },

  async getHotelStaff(hotelId) {
    const res = await pool.query(`
      SELECT * FROM hotel_staff 
      WHERE hotel_id = $1 
      ORDER BY created_at ASC;
    `, [hotelId]);
    return res.rows;
  },

  async createHotelStaff(hotelId, { name, role, email, phone, shift = 'MORNING' }) {
    const res = await pool.query(`
      INSERT INTO hotel_staff (hotel_id, name, role, email, phone, status, shift)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)
      RETURNING *;
    `, [hotelId, name, role, email || '', phone || '', shift]);
    return res.rows[0];
  }
};
