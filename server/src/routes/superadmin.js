import { Router } from 'express';
import { pool } from '../db.js';
import { multiTenantDb } from '../multiTenantDb.js';
import { rbacDb } from '../rbacDb.js';

const router = Router();

// Strict RBAC Guard: Only SUPER_ADMIN allowed
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied: Super Admin privileges required.' });
  }
  next();
});

// GET /api/superadmin/overview - Consolidated platform overview
router.get('/overview', async (req, res) => {
  try {
    const data = await multiTenantDb.getSuperAdminOverview();
    res.json(data);
  } catch (err) {
    console.error('Superadmin overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch platform overview' });
  }
});

// GET /api/superadmin/hotels - All hotels with performance
router.get('/hotels', async (req, res) => {
  try {
    const hotels = await multiTenantDb.getAllHotels();
    res.json(hotels);
  } catch (err) {
    console.error('Superadmin hotels error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// POST /api/superadmin/hotels - Register new hotel & optional owner
router.post('/hotels', async (req, res) => {
  try {
    const { name, slug, currency = 'USD', taxPercentage = 10, contactEmail, contactPhone, ownerUsername, ownerPassword } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Hotel name and slug are required' });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = await pool.query('SELECT id FROM hotels WHERE slug = $1;', [cleanSlug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `Slug "${cleanSlug}" is already taken.` });
    }

    const insertHotel = await pool.query(`
      INSERT INTO hotels (name, slug, currency, tax_percentage, contact_email, contact_phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
      RETURNING *;
    `, [name.trim(), cleanSlug, currency, parseFloat(taxPercentage) || 10, contactEmail || '', contactPhone || '']);
    const newHotel = insertHotel.rows[0];

    // If owner credentials provided, create hotel owner
    if (ownerUsername && ownerPassword) {
      await pool.query(`
        INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
        VALUES ($1, $2, 'HOTEL_OWNER', $3, $4, $5, 'ACTIVE');
      `, [ownerUsername.trim(), ownerPassword.trim(), newHotel.id, `${name} Owner`, contactEmail || '']);
    }

    await multiTenantDb.logAudit(newHotel.id, req.user.user_id, req.user.username, 'CREATE_HOTEL', 'HOTELS', {
      hotelName: name,
      slug: cleanSlug
    });

    res.status(201).json({ success: true, hotel: newHotel });
  } catch (err) {
    console.error('Create hotel error:', err.message);
    res.status(500).json({ error: 'Failed to register hotel' });
  }
});

// PATCH /api/superadmin/hotels/:id/status - Toggle status
router.patch('/hotels/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required (ACTIVE/INACTIVE)' });
    }

    const updated = await multiTenantDb.toggleHotelStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'Hotel not found' });

    await multiTenantDb.logAudit(id, req.user.user_id, req.user.username, 'UPDATE_HOTEL_STATUS', 'HOTELS', { status });
    res.json({ success: true, hotel: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hotel status' });
  }
});

// PUT /api/superadmin/hotels/:id - Update hotel details
router.put('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, currency, taxPercentage, contactEmail, contactPhone, status, totalRooms } = req.body || {};

    const updated = await multiTenantDb.updateHotel(id, {
      name, currency, taxPercentage, contactEmail, contactPhone, status, totalRooms
    });
    if (!updated) return res.status(404).json({ error: 'Hotel not found' });

    await multiTenantDb.logAudit(id, req.user.user_id, req.user.username, 'UPDATE_HOTEL', 'HOTELS', {
      hotelName: updated.name,
      updatedFields: req.body
    });

    res.json({ success: true, hotel: updated });
  } catch (err) {
    console.error('Update hotel error:', err.message);
    res.status(500).json({ error: 'Failed to update hotel details' });
  }
});

// DELETE /api/superadmin/hotels/:id - Delete hotel
router.delete('/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query('SELECT name FROM hotels WHERE id = $1;', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Hotel not found' });

    await pool.query('DELETE FROM hotels WHERE id = $1;', [id]);
    await multiTenantDb.logAudit(id, req.user.user_id, req.user.username, 'DELETE_HOTEL', 'HOTELS', { hotelName: check.rows[0].name });

    res.json({ success: true, message: `Hotel "${check.rows[0].name}" deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hotel' });
  }
});

// GET /api/superadmin/users - Platform users
router.get('/users', async (req, res) => {
  try {
    const users = await multiTenantDb.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/superadmin/users - Create user
router.post('/users', async (req, res) => {
  try {
    const { username, password, role, hotelId, fullName, email } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password and role are required' });
    }

    const resUser = await pool.query(`
      INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
      RETURNING id, username, role, hotel_id, full_name, email, status;
    `, [username.trim(), password.trim(), role, hotelId || null, fullName || '', email || '']);

    await multiTenantDb.logAudit(hotelId || null, req.user.user_id, req.user.username, 'CREATE_USER', 'USERS', {
      createdUsername: username,
      assignedRole: role
    });

    res.status(201).json(resUser.rows[0]);
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Failed to create user (username may already exist)' });
  }
});

// GET /api/superadmin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await pool.query(`
      SELECT a.*, h.name as hotel_name
      FROM system_audit_logs a
      LEFT JOIN hotels h ON a.hotel_id = h.id
      ORDER BY a.timestamp DESC
      LIMIT 100;
    `);
    res.json(logs.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/superadmin/reports - Consolidated Platform Report
router.get('/reports', async (req, res) => {
  try {
    const reportData = await multiTenantDb.getSuperAdminOverview();
    res.json({
      generatedAt: new Date().toISOString(),
      platform: 'AURA Multi-Tenant Hotel Management',
      metrics: {
        totalHotels: reportData.totalHotels,
        activeHotels: reportData.activeHotels,
        totalRooms: reportData.totalRooms,
        totalBookings: reportData.totalBookings,
        totalRevenue: reportData.totalRevenue,
        totalCollections: reportData.totalCollections
      },
      hotels: reportData.hotelPerformance
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate platform report' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC ROLE-BASED ACCESS CONTROL (RBAC) ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/superadmin/rbac/roles - List all roles with user count and permissions
router.get('/rbac/roles', async (req, res) => {
  try {
    const roles = await rbacDb.getAllRoles();
    res.json(roles);
  } catch (err) {
    console.error('RBAC get roles error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/superadmin/rbac/roles - Create new role with module permissions
router.post('/rbac/roles', async (req, res) => {
  try {
    const { code, name, description, permissions } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Role code and name are required' });
    }

    const newRole = await rbacDb.createRole({ code, name, description, permissions });

    await multiTenantDb.logAudit(null, req.user.user_id, req.user.username, 'CREATE_RBAC_ROLE', 'RBAC', {
      roleCode: newRole.code,
      roleName: newRole.name
    });

    res.status(201).json(newRole);
  } catch (err) {
    console.error('RBAC create role error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to create role' });
  }
});

// PUT /api/superadmin/rbac/roles/:id - Edit role details
router.put('/rbac/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await rbacDb.updateRole(id, { name, description });
    if (!updated) return res.status(404).json({ error: 'Role not found' });

    await multiTenantDb.logAudit(null, req.user.user_id, req.user.username, 'UPDATE_RBAC_ROLE', 'RBAC', {
      roleId: id,
      name
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/superadmin/rbac/roles/:id - Delete custom role
router.delete('/rbac/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await rbacDb.deleteRole(id);

    await multiTenantDb.logAudit(null, req.user.user_id, req.user.username, 'DELETE_RBAC_ROLE', 'RBAC', {
      roleId: id
    });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to delete role' });
  }
});

// GET /api/superadmin/rbac/modules - List all system modules / menus
router.get('/rbac/modules', async (req, res) => {
  try {
    const modules = await rbacDb.getAllModules();
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// GET /api/superadmin/rbac/roles/:id/permissions - Get menu-level permissions for role
router.get('/rbac/roles/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = await rbacDb.getRolePermissions(id);
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// PUT /api/superadmin/rbac/roles/:id/permissions - Batch update role permissions
router.put('/rbac/roles/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions array is required' });
    }

    const updated = await rbacDb.updateRolePermissions(id, permissions);

    await multiTenantDb.logAudit(null, req.user.user_id, req.user.username, 'UPDATE_ROLE_PERMISSIONS', 'RBAC', {
      roleId: id,
      count: permissions.length
    });

    res.json({ success: true, permissions: updated });
  } catch (err) {
    console.error('Update role permissions error:', err.message);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

// GET /api/superadmin/rbac/users - Users with assigned roles
router.get('/rbac/users', async (req, res) => {
  try {
    const users = await rbacDb.getAllUsersWithRoles();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users with roles' });
  }
});

// POST /api/superadmin/rbac/users - Create user with assigned roles
router.post('/rbac/users', async (req, res) => {
  try {
    const { username, password, roleIds = [], hotelId, fullName, email } = req.body;
    if (!username || !password || !Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({ error: 'Username, password and at least one role are required' });
    }

    const newUser = await rbacDb.createUserWithRoles({
      username,
      password,
      roleIds,
      hotelId: hotelId || null,
      fullName: fullName || '',
      email: email || ''
    });

    await multiTenantDb.logAudit(hotelId || null, req.user.user_id, req.user.username, 'CREATE_USER_WITH_ROLES', 'USERS', {
      createdUserId: newUser.id,
      username: newUser.username,
      rolesAssigned: roleIds
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Create user with roles error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to create user' });
  }
});

// PUT /api/superadmin/rbac/users/:id/roles - Update user's assigned roles
router.put('/rbac/users/:id/roles', async (req, res) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;
    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'Array of roleIds required' });
    }

    await rbacDb.assignUserRoles(id, roleIds);

    await multiTenantDb.logAudit(null, req.user.user_id, req.user.username, 'UPDATE_USER_ROLES', 'RBAC', {
      userId: id,
      newRoleIds: roleIds
    });

    res.json({ success: true, message: 'User roles updated successfully' });
  } catch (err) {
    console.error('Assign user roles error:', err.message);
    res.status(500).json({ error: 'Failed to assign user roles' });
  }
});

export default router;
