import { pool } from '../src/db.js';

async function seedLaybhariData() {
  const client = await pool.connect();
  try {
    // 1. Get Hotel Lay Bhari
    const hotelRes = await client.query("SELECT id FROM hotels WHERE slug = 'laybhari';");
    if (hotelRes.rows.length === 0) {
      console.log('Hotel laybhari not found!');
      return;
    }
    const hotelId = hotelRes.rows[0].id;
    console.log('Hotel Lay Bhari ID:', hotelId);

    // 2. Insert or update owner_laybhari user
    const userRes = await client.query(`
      INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
      VALUES ($1, $2, 'HOTEL_OWNER', $3, $4, $5, 'ACTIVE')
      ON CONFLICT (username) DO UPDATE 
        SET role = 'HOTEL_OWNER', hotel_id = $3, full_name = $4
      RETURNING id, username, role;
    `, [
      'owner_laybhari',
      'password123',
      hotelId,
      'Tanaji Rao (Hotel Lay Bhari Owner)',
      'owner@hotellaybhari.com'
    ]);
    const user = userRes.rows[0];
    console.log('User owner_laybhari ready:', user);

    // 3. Assign role in rbac_user_roles
    const roleRes = await client.query("SELECT id FROM rbac_roles WHERE code = 'HOTEL_OWNER';");
    if (roleRes.rows.length > 0) {
      const roleId = roleRes.rows[0].id;
      await client.query(`
        INSERT INTO rbac_user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING;
      `, [user.id, roleId]);
      console.log('Assigned HOTEL_OWNER role in rbac_user_roles');
    }

    // 4. Seed Rooms for Hotel Lay Bhari if not exists
    const roomsCount = await client.query('SELECT COUNT(*) FROM hotel_rooms WHERE hotel_id = $1;', [hotelId]);
    if (parseInt(roomsCount.rows[0].count, 10) === 0) {
      const laybhariRooms = [
        { num: '101', cat: 'Executive AC Room', price: 2200, status: 'OCCUPIED', floor: 1, amenities: ['AC', 'Queen Bed', 'Free Wi-Fi', 'Hot Water'] },
        { num: '102', cat: 'Executive AC Room', price: 2200, status: 'AVAILABLE', floor: 1, amenities: ['AC', 'Queen Bed', 'Free Wi-Fi', 'Hot Water'] },
        { num: '103', cat: 'Standard Non-AC', price: 1400, status: 'OCCUPIED', floor: 1, amenities: ['Ceiling Fan', 'Double Bed', 'Hot Water'] },
        { num: '104', cat: 'Standard Non-AC', price: 1400, status: 'AVAILABLE', floor: 1, amenities: ['Ceiling Fan', 'Double Bed', 'Hot Water'] },
        { num: '201', cat: 'Deluxe Family Suite', price: 3500, status: 'OCCUPIED', floor: 2, amenities: ['AC', 'King Bed + Sofa', 'Balcony', 'Smart TV'] },
        { num: '202', cat: 'Deluxe Family Suite', price: 3500, status: 'AVAILABLE', floor: 2, amenities: ['AC', 'King Bed + Sofa', 'Balcony', 'Smart TV'] },
        { num: '203', cat: 'Royal Heritage Suite', price: 4800, status: 'OCCUPIED', floor: 2, amenities: ['AC', 'Maharaja King Bed', 'Mountain View', 'Jacuzzi'] },
        { num: '204', cat: 'Royal Heritage Suite', price: 4800, status: 'RESERVED', floor: 2, amenities: ['AC', 'Maharaja King Bed', 'Mountain View', 'Jacuzzi'] },
        { num: '105', cat: 'Standard Non-AC', price: 1400, status: 'MAINTENANCE', floor: 1, amenities: ['Ceiling Fan', 'Double Bed'] },
        { num: '106', cat: 'Executive AC Room', price: 2200, status: 'AVAILABLE', floor: 1, amenities: ['AC', 'Queen Bed', 'Balcony'] },
      ];
      for (const r of laybhariRooms) {
        await client.query(`
          INSERT INTO hotel_rooms (hotel_id, room_number, category, price_per_night, status, floor, amenities)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (hotel_id, room_number) DO NOTHING;
        `, [hotelId, r.num, r.cat, r.price, r.status, r.floor, r.amenities]);
      }
      console.log('Seeded 10 rooms for Hotel Lay Bhari');
    }

    // 5. Seed Bookings for Hotel Lay Bhari if not exists
    const bookingsCount = await client.query('SELECT COUNT(*) FROM hotel_bookings WHERE hotel_id = $1;', [hotelId]);
    if (parseInt(bookingsCount.rows[0].count, 10) === 0) {
      const laybhariBookings = [
        { code: 'BK-LB-101', guest: 'Rajesh Patil', email: 'rajesh.patil@gmail.com', phone: '+91 98220 11223', roomNum: '203', cat: 'Royal Heritage Suite', checkIn: '2026-11-17', checkOut: '2026-11-20', total: 14400, paid: 14400, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'DIRECT', method: 'ONLINE', disc: 0, tax: 720 },
        { code: 'BK-LB-102', guest: 'Sneha Deshmukh', email: 'sneha.d@tcs.com', phone: '+91 99701 44556', roomNum: '201', cat: 'Deluxe Family Suite', checkIn: '2026-11-18', checkOut: '2026-11-21', total: 10500, paid: 10500, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'OTA_BOOKING', method: 'CARD', disc: 500, tax: 500 },
        { code: 'BK-LB-103', guest: 'Amit Shinde', email: 'amit.shinde@mahindra.com', phone: '+91 94223 77889', roomNum: '101', cat: 'Executive AC Room', checkIn: '2026-11-18', checkOut: '2026-11-19', total: 2200, paid: 2200, pStatus: 'PAID', bStatus: 'CONFIRMED', source: 'WALK_IN', method: 'CASH', disc: 0, tax: 110 },
        { code: 'BK-LB-104', guest: 'Vikram Pawar', email: 'vpawar@punebiz.in', phone: '+91 98811 22334', roomNum: '103', cat: 'Standard Non-AC', checkIn: '2026-11-16', checkOut: '2026-11-18', total: 2800, paid: 2800, pStatus: 'PAID', bStatus: 'COMPLETED', source: 'DIRECT', method: 'ONLINE', disc: 0, tax: 140 },
        { code: 'BK-LB-105', guest: 'Pooja Kulkarni', email: 'pooja.k@infy.com', phone: '+91 97654 32109', roomNum: '204', cat: 'Royal Heritage Suite', checkIn: '2026-11-19', checkOut: '2026-11-23', total: 19200, paid: 5000, pStatus: 'PARTIAL', bStatus: 'CONFIRMED', source: 'WEBSITE', method: 'ONLINE', disc: 1000, tax: 910 },
      ];
      for (const b of laybhariBookings) {
        await client.query(`
          INSERT INTO hotel_bookings (
            hotel_id, booking_code, guest_name, guest_email, guest_phone, room_number, room_category,
            check_in, check_out, total_amount, paid_amount, payment_status, booking_status, booking_source,
            payment_method, discount_amount, tax_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
        `, [
          hotelId, b.code, b.guest, b.email, b.phone, b.roomNum, b.cat,
          b.checkIn, b.checkOut, b.total, b.paid, b.pStatus, b.bStatus, b.source,
          b.method, b.disc || 0, b.tax || 0
        ]);
      }
      console.log('Seeded 5 bookings for Hotel Lay Bhari');
    }

    // 6. Seed Staff for Hotel Lay Bhari if not exists
    const staffCount = await client.query('SELECT COUNT(*) FROM hotel_staff WHERE hotel_id = $1;', [hotelId]);
    if (parseInt(staffCount.rows[0].count, 10) === 0) {
      const laybhariStaff = [
        { name: 'Dnyaneshwar More', role: 'Executive Head Chef', email: 'chef@hotellaybhari.com', phone: '+91 98231 00112', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Sunita Jadhav', role: 'Front Desk Manager', email: 'sunita@hotellaybhari.com', phone: '+91 98231 00113', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Santosh Kadam', role: 'Dining Captain', email: 'santosh@hotellaybhari.com', phone: '+91 98231 00114', status: 'ACTIVE', shift: 'EVENING' },
        { name: 'Ramesh Gaikwad', role: 'Housekeeping Lead', email: 'ramesh@hotellaybhari.com', phone: '+91 98231 00115', status: 'ACTIVE', shift: 'MORNING' },
        { name: 'Kishore Shinde', role: 'Maintenance Technician', email: 'kishore@hotellaybhari.com', phone: '+91 98231 00116', status: 'ACTIVE', shift: 'NIGHT' },
      ];
      for (const s of laybhariStaff) {
        await client.query(`
          INSERT INTO hotel_staff (hotel_id, name, role, email, phone, status, shift)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [hotelId, s.name, s.role, s.email, s.phone, s.status, s.shift]);
      }
      console.log('Seeded 5 staff members for Hotel Lay Bhari');
    }

    // 7. Seed Transactions for Hotel Lay Bhari if not exists
    const txCount = await client.query('SELECT COUNT(*) FROM hotel_transactions WHERE hotel_id = $1;', [hotelId]);
    if (parseInt(txCount.rows[0].count, 10) === 0) {
      const laybhariTx = [
        { amount: 14400, type: 'PAYMENT', cat: 'ROOM_BOOKING', method: 'ONLINE', desc: 'Full payment for BK-LB-101' },
        { amount: 10500, type: 'PAYMENT', cat: 'ROOM_BOOKING', method: 'CARD', desc: 'Card settlement for BK-LB-102' },
        { amount: 2200, type: 'PAYMENT', cat: 'ROOM_BOOKING', method: 'CASH', desc: 'Front desk cash payment BK-LB-103' },
        { amount: 2800, type: 'PAYMENT', cat: 'ROOM_BOOKING', method: 'ONLINE', desc: 'Online UPI payment for BK-LB-104' },
        { amount: 5000, type: 'PAYMENT', cat: 'ROOM_BOOKING', method: 'ONLINE', desc: 'Advance deposit BK-LB-105' },
        { amount: 3200, type: 'PAYMENT', cat: 'RESTAURANT', method: 'UPI', desc: 'Table 4 Dining bill settlement' },
      ];
      for (const t of laybhariTx) {
        await client.query(`
          INSERT INTO hotel_transactions (hotel_id, amount, type, category, payment_method, status, description)
          VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6);
        `, [hotelId, t.amount, t.type, t.cat, t.method, t.desc]);
      }
      console.log('Seeded 6 transactions for Hotel Lay Bhari');
    }

    console.log('✓ All Lay Bhari data seeded successfully!');
  } finally {
    client.release();
  }
}

seedLaybhariData().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
