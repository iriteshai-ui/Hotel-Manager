import { pool } from '../src/db.js';

async function fix() {
  const roleRes = await pool.query("SELECT id FROM rbac_roles WHERE code = 'HOTEL_OWNER';");
  const roleId = roleRes.rows[0].id;
  const userRes = await pool.query("SELECT id FROM app_users WHERE username = 'owner_laybhari';");
  const userId = userRes.rows[0].id;
  await pool.query("UPDATE app_users SET role = 'HOTEL_OWNER' WHERE id = $1;", [userId]);
  await pool.query("INSERT INTO rbac_user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING;", [userId, roleId]);
  console.log('Restored HOTEL_OWNER role for owner_laybhari');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
