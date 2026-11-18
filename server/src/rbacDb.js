import { pool } from './db.js';

export async function initRbacSchema() {
  const client = await pool.connect();
  try {
    // 1. Roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rbac_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Modules / Menus table
      CREATE TABLE IF NOT EXISTS rbac_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        label VARCHAR(100) NOT NULL,
        description TEXT,
        path VARCHAR(255) NOT NULL,
        icon VARCHAR(50) DEFAULT 'Folder',
        scope VARCHAR(50) DEFAULT 'ALL',
        category VARCHAR(50) DEFAULT 'General',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Role Permissions table (Menu-level permissions)
      CREATE TABLE IF NOT EXISTS rbac_role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
        module_code VARCHAR(50) NOT NULL,
        can_view BOOLEAN DEFAULT TRUE,
        can_add BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        can_manage BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(role_id, module_code)
      );

      -- 4. User to Role Mapping table (Many-to-Many support)
      CREATE TABLE IF NOT EXISTS rbac_user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, role_id)
      );
    `);

    // 5. Seed Core Modules / Menus
    const modules = [
      { code: 'DASHBOARD', label: 'Business Overview', desc: 'KPI summary, occupancy rates, daily sales, real-time check-ins/outs', path: '/hotel-dashboard', icon: 'LayoutDashboard', scope: 'TENANT', cat: 'Operations', order: 10 },
      { code: 'BOOKINGS', label: 'Guest Reservations', desc: 'Manage reservations, guest arrivals, stay dates, and walk-in check-ins', path: '/hotel-dashboard?tab=bookings', icon: 'CalendarCheck', scope: 'TENANT', cat: 'Front Desk', order: 20 },
      { code: 'ROOMS', label: 'Room Inventory', desc: 'Room matrix, categories, pricing, housekeeping and maintenance status', path: '/hotel-dashboard?tab=rooms', icon: 'BedDouble', scope: 'TENANT', cat: 'Housekeeping', order: 30 },
      { code: 'CUSTOMERS', label: 'Guest Profiles (CRM)', desc: 'Guest contact directory, loyalty history, and lifetime spending', path: '/hotel-dashboard?tab=customers', icon: 'Users', scope: 'TENANT', cat: 'Front Desk', order: 40 },
      { code: 'DINING_MENU', label: 'Restaurant & Dining', desc: 'Menu engineering, pricing, bestseller pins, dietary tags, and kitchen POS', path: '/manager', icon: 'UtensilsCrossed', scope: 'ALL', cat: 'Dining', order: 50 },
      { code: 'FINANCIALS', label: 'Financial Reports & Ledger', desc: 'Gross & net revenue, cashier settlement, refunds, taxes, and CSV reports', path: '/hotel-dashboard?tab=financials', icon: 'DollarSign', scope: 'TENANT', cat: 'Finance', order: 60 },
      { code: 'STAFF', label: 'Staff & Shift Operations', desc: 'Employee rosters, daily active shifts, and operational task assignments', path: '/hotel-dashboard?tab=staff', icon: 'UserCheck', scope: 'TENANT', cat: 'Human Resources', order: 70 },
      { code: 'HOTELS', label: 'Hotel Properties', desc: 'Multi-tenant hotel property setup, currency, tax rules, and branding', path: '/superadmin?tab=hotels', icon: 'Building2', scope: 'PLATFORM', cat: 'Administration', order: 80 },
      { code: 'RBAC_ROLES', label: 'Roles & Access Control (RBAC)', desc: 'Dynamic role creation, menu access, and granular CRUD permissions', path: '/superadmin?tab=rbac', icon: 'ShieldAlert', scope: 'PLATFORM', cat: 'Security & Access', order: 90 },
      { code: 'AUDIT_LOGS', label: 'Security & Audit Logs', desc: 'Immutable platform audit trail of user access and property changes', path: '/superadmin?tab=audit', icon: 'FileText', scope: 'PLATFORM', cat: 'Security & Access', order: 100 },
      { code: 'SETTINGS', label: 'Platform & Property Settings', desc: 'Branding themes, currency, invoice formats, and operational rules', path: '/hotel-dashboard?tab=settings', icon: 'Settings', scope: 'ALL', cat: 'General', order: 110 }
    ];

    for (const m of modules) {
      await client.query(`
        INSERT INTO rbac_modules (code, label, description, path, icon, scope, category, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO UPDATE 
        SET label = $2, description = $3, path = $4, icon = $5, scope = $6, category = $7, sort_order = $8;
      `, [m.code, m.label, m.desc, m.path, m.icon, m.scope, m.cat, m.order]);
    }

    // 6. Seed Default Roles
    const roles = [
      {
        code: 'SUPER_ADMIN',
        name: 'Super Admin (Platform Owner)',
        description: 'Complete unrestricted platform authority across all hotels, modules, users, and security settings.',
        isSystem: true
      },
      {
        code: 'HOTEL_OWNER',
        name: 'Hotel Property Owner',
        description: 'Full administrative authority over their assigned hotel property, rooms, staff, dining and financials.',
        isSystem: true
      },
      {
        code: 'MANAGER',
        name: 'Hotel General Manager',
        description: 'Oversees daily hotel operations, front desk reservations, room assignments, dining, and staff shifts.',
        isSystem: false
      },
      {
        code: 'RECEPTIONIST',
        name: 'Front Desk Receptionist',
        description: 'Handles guest reservations, room check-in/out, and guest profile maintenance.',
        isSystem: false
      },
      {
        code: 'ACCOUNTANT',
        name: 'Financial Auditor & Accountant',
        description: 'Audits transaction journals, room billing, collections, taxes, and financial statement exports.',
        isSystem: false
      },
      {
        code: 'STAFF',
        name: 'Service Staff / Waiter',
        description: 'General front-line operations, dining order placement, and guest service assistance.',
        isSystem: false
      }
    ];

    for (const r of roles) {
      await client.query(`
        INSERT INTO rbac_roles (code, name, description, is_system)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO UPDATE
        SET name = $2, description = $3, is_system = $4;
      `, [r.code, r.name, r.description, r.isSystem]);
    }

    // 7. Configure Permissions for each Default Role
    const allRoleRows = await client.query('SELECT id, code FROM rbac_roles;');
    const roleIdMap = {};
    for (const row of allRoleRows.rows) {
      roleIdMap[row.code] = row.id;
    }

    // Matrix configuration: [roleCode, moduleCode, view, add, edit, delete, manage]
    const permissionMatrix = [
      // SUPER_ADMIN has ALL permissions on ALL modules
      ...modules.map(m => ['SUPER_ADMIN', m.code, true, true, true, true, true]),

      // HOTEL_OWNER has full control over all tenant modules
      ['HOTEL_OWNER', 'DASHBOARD', true, true, true, true, true],
      ['HOTEL_OWNER', 'BOOKINGS', true, true, true, true, true],
      ['HOTEL_OWNER', 'ROOMS', true, true, true, true, true],
      ['HOTEL_OWNER', 'CUSTOMERS', true, true, true, true, true],
      ['HOTEL_OWNER', 'DINING_MENU', true, true, true, true, true],
      ['HOTEL_OWNER', 'FINANCIALS', true, true, true, true, true],
      ['HOTEL_OWNER', 'STAFF', true, true, true, true, true],
      ['HOTEL_OWNER', 'SETTINGS', true, true, true, true, true],
      ['HOTEL_OWNER', 'HOTELS', false, false, false, false, false],
      ['HOTEL_OWNER', 'RBAC_ROLES', false, false, false, false, false],
      ['HOTEL_OWNER', 'AUDIT_LOGS', false, false, false, false, false],

      // MANAGER: operational control, no delete/financial purge, no platform admin
      ['MANAGER', 'DASHBOARD', true, false, false, false, false],
      ['MANAGER', 'BOOKINGS', true, true, true, false, true],
      ['MANAGER', 'ROOMS', true, true, true, false, false],
      ['MANAGER', 'CUSTOMERS', true, true, true, false, false],
      ['MANAGER', 'DINING_MENU', true, true, true, true, true],
      ['MANAGER', 'FINANCIALS', true, false, false, false, false],
      ['MANAGER', 'STAFF', true, true, true, false, false],
      ['MANAGER', 'SETTINGS', true, false, true, false, false],
      ['MANAGER', 'HOTELS', false, false, false, false, false],
      ['MANAGER', 'RBAC_ROLES', false, false, false, false, false],
      ['MANAGER', 'AUDIT_LOGS', false, false, false, false, false],

      // RECEPTIONIST: front desk bookings, room viewing/status, guest CRM
      ['RECEPTIONIST', 'DASHBOARD', true, false, false, false, false],
      ['RECEPTIONIST', 'BOOKINGS', true, true, true, false, false],
      ['RECEPTIONIST', 'ROOMS', true, false, true, false, false],
      ['RECEPTIONIST', 'CUSTOMERS', true, true, true, false, false],
      ['RECEPTIONIST', 'DINING_MENU', true, false, false, false, false],
      ['RECEPTIONIST', 'FINANCIALS', false, false, false, false, false],
      ['RECEPTIONIST', 'STAFF', false, false, false, false, false],
      ['RECEPTIONIST', 'SETTINGS', false, false, false, false, false],
      ['RECEPTIONIST', 'HOTELS', false, false, false, false, false],
      ['RECEPTIONIST', 'RBAC_ROLES', false, false, false, false, false],
      ['RECEPTIONIST', 'AUDIT_LOGS', false, false, false, false, false],

      // ACCOUNTANT: financial reports, invoice auditing, customer spending
      ['ACCOUNTANT', 'DASHBOARD', true, false, false, false, false],
      ['ACCOUNTANT', 'BOOKINGS', true, false, false, false, false],
      ['ACCOUNTANT', 'ROOMS', false, false, false, false, false],
      ['ACCOUNTANT', 'CUSTOMERS', true, false, false, false, false],
      ['ACCOUNTANT', 'DINING_MENU', false, false, false, false, false],
      ['ACCOUNTANT', 'FINANCIALS', true, true, true, false, true],
      ['ACCOUNTANT', 'STAFF', false, false, false, false, false],
      ['ACCOUNTANT', 'SETTINGS', false, false, false, false, false],
      ['ACCOUNTANT', 'HOTELS', false, false, false, false, false],
      ['ACCOUNTANT', 'RBAC_ROLES', false, false, false, false, false],
      ['ACCOUNTANT', 'AUDIT_LOGS', false, false, false, false, false],

      // STAFF: view bookings, room status, manage dining menu orders
      ['STAFF', 'DASHBOARD', false, false, false, false, false],
      ['STAFF', 'BOOKINGS', true, false, false, false, false],
      ['STAFF', 'ROOMS', true, false, false, false, false],
      ['STAFF', 'CUSTOMERS', false, false, false, false, false],
      ['STAFF', 'DINING_MENU', true, true, false, false, false],
      ['STAFF', 'FINANCIALS', false, false, false, false, false],
      ['STAFF', 'STAFF', false, false, false, false, false],
      ['STAFF', 'SETTINGS', false, false, false, false, false],
      ['STAFF', 'HOTELS', false, false, false, false, false],
      ['STAFF', 'RBAC_ROLES', false, false, false, false, false],
      ['STAFF', 'AUDIT_LOGS', false, false, false, false, false],
    ];

    for (const [rCode, mCode, view, add, edit, del, mgmt] of permissionMatrix) {
      const rId = roleIdMap[rCode];
      if (rId) {
        await client.query(`
          INSERT INTO rbac_role_permissions (role_id, module_code, can_view, can_add, can_edit, can_delete, can_manage, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (role_id, module_code) DO NOTHING;
        `, [rId, mCode, view, add, edit, del, mgmt]);
      }
    }

    // 8. Synchronize app_users to rbac_user_roles
    const usersRes = await client.query('SELECT id, role FROM app_users;');
    for (const u of usersRes.rows) {
      let mappedRoleCode = u.role;
      if (mappedRoleCode === 'WAITER' || mappedRoleCode === 'KITCHEN') {
        mappedRoleCode = 'STAFF';
      }
      const roleId = roleIdMap[mappedRoleCode];
      if (roleId) {
        await client.query(`
          INSERT INTO rbac_user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [u.id, roleId]);
      }
    }

    console.log('✓ Dynamic RBAC System initialized (Roles, Modules, Permissions & User Mappings)');
  } finally {
    client.release();
  }
}

export const rbacDb = {
  // Roles Management
  async getAllRoles() {
    const res = await pool.query(`
      SELECT r.*,
             COUNT(DISTINCT ur.user_id)::int as user_count,
             COALESCE(
               json_agg(
                 json_build_object(
                   'module_code', p.module_code,
                   'can_view', p.can_view,
                   'can_add', p.can_add,
                   'can_edit', p.can_edit,
                   'can_delete', p.can_delete,
                   'can_manage', p.can_manage
                 )
               ) FILTER (WHERE p.id IS NOT NULL), '[]'::json
             ) as permissions
      FROM rbac_roles r
      LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id
      LEFT JOIN rbac_role_permissions p ON r.id = p.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name ASC;
    `);
    return res.rows;
  },

  async getRoleById(roleId) {
    const res = await pool.query('SELECT * FROM rbac_roles WHERE id = $1;', [roleId]);
    return res.rows[0] || null;
  },

  async createRole({ code, name, description, permissions = [] }) {
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = await pool.query('SELECT id FROM rbac_roles WHERE code = $1;', [cleanCode]);
    if (existing.rows.length > 0) {
      throw new Error(`A role with code '${cleanCode}' already exists.`);
    }

    const insertRes = await pool.query(`
      INSERT INTO rbac_roles (code, name, description, is_system)
      VALUES ($1, $2, $3, FALSE)
      RETURNING *;
    `, [cleanCode, name.trim(), description || '']);
    const newRole = insertRes.rows[0];

    // Seed default permissions for all modules if not specified
    const modulesRes = await pool.query('SELECT code FROM rbac_modules;');
    for (const m of modulesRes.rows) {
      const p = permissions.find(item => item.module_code === m.code) || {};
      await pool.query(`
        INSERT INTO rbac_role_permissions (role_id, module_code, can_view, can_add, can_edit, can_delete, can_manage)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (role_id, module_code) DO NOTHING;
      `, [
        newRole.id,
        m.code,
        p.can_view === true,
        p.can_add === true,
        p.can_edit === true,
        p.can_delete === true,
        p.can_manage === true
      ]);
    }

    return newRole;
  },

  async updateRole(roleId, { name, description }) {
    const res = await pool.query(`
      UPDATE rbac_roles
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [name, description, roleId]);
    return res.rows[0] || null;
  },

  async deleteRole(roleId) {
    const check = await pool.query('SELECT code, is_system FROM rbac_roles WHERE id = $1;', [roleId]);
    if (check.rows.length === 0) throw new Error('Role not found.');
    if (check.rows[0].is_system) {
      throw new Error(`Cannot delete protected system role '${check.rows[0].code}'.`);
    }

    await pool.query('DELETE FROM rbac_roles WHERE id = $1;', [roleId]);
    return true;
  },

  // Modules / Menus Management
  async getAllModules() {
    const res = await pool.query('SELECT * FROM rbac_modules ORDER BY sort_order ASC, label ASC;');
    return res.rows;
  },

  // Permissions Management
  async getRolePermissions(roleId) {
    const res = await pool.query(`
      SELECT m.code as module_code, m.label, m.description, m.path, m.icon, m.category, m.scope,
             COALESCE(p.can_view, FALSE) as can_view,
             COALESCE(p.can_add, FALSE) as can_add,
             COALESCE(p.can_edit, FALSE) as can_edit,
             COALESCE(p.can_delete, FALSE) as can_delete,
             COALESCE(p.can_manage, FALSE) as can_manage
      FROM rbac_modules m
      LEFT JOIN rbac_role_permissions p ON m.code = p.module_code AND p.role_id = $1
      ORDER BY m.sort_order ASC;
    `, [roleId]);
    return res.rows;
  },

  async updateRolePermissions(roleId, modulePermissions = []) {
    // modulePermissions: Array of { module_code, can_view, can_add, can_edit, can_delete, can_manage }
    for (const p of modulePermissions) {
      await pool.query(`
        INSERT INTO rbac_role_permissions (role_id, module_code, can_view, can_add, can_edit, can_delete, can_manage, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (role_id, module_code) DO UPDATE
        SET can_view = $3,
            can_add = $4,
            can_edit = $5,
            can_delete = $6,
            can_manage = $7,
            updated_at = NOW();
      `, [
        roleId,
        p.module_code,
        p.can_view === true,
        p.can_add === true,
        p.can_edit === true,
        p.can_delete === true,
        p.can_manage === true
      ]);
    }
    return this.getRolePermissions(roleId);
  },

  // User-Role Mapping & Permission Aggregation
  async getUserRolesAndPermissions(userId) {
    // 1. Fetch user roles
    const rolesRes = await pool.query(`
      SELECT r.id, r.code, r.name, r.is_system
      FROM rbac_roles r
      JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1;
    `, [userId]);

    const roles = rolesRes.rows;
    const roleCodes = roles.map(r => r.code);

    // If user has SUPER_ADMIN role, grant all permissions
    const isSuper = roleCodes.includes('SUPER_ADMIN');

    // 2. Fetch all modules
    const modulesRes = await pool.query('SELECT * FROM rbac_modules ORDER BY sort_order ASC;');
    const modules = modulesRes.rows;

    // 3. If SUPER_ADMIN, return full wildcard permissions
    if (isSuper) {
      const permissions = {};
      for (const m of modules) {
        permissions[m.code] = {
          can_view: true,
          can_add: true,
          can_edit: true,
          can_delete: true,
          can_manage: true
        };
      }
      return {
        roles: roleCodes,
        roleDetails: roles,
        permissions,
        accessibleModules: modules
      };
    }

    // 4. Otherwise, compute permissions across all assigned roles
    const permsRes = await pool.query(`
      SELECT p.module_code,
             bool_or(p.can_view) as can_view,
             bool_or(p.can_add) as can_add,
             bool_or(p.can_edit) as can_edit,
             bool_or(p.can_delete) as can_delete,
             bool_or(p.can_manage) as can_manage
      FROM rbac_role_permissions p
      JOIN rbac_user_roles ur ON p.role_id = ur.role_id
      WHERE ur.user_id = $1
      GROUP BY p.module_code;
    `, [userId]);

    const permissions = {};
    for (const row of permsRes.rows) {
      permissions[row.module_code] = {
        can_view: row.can_view === true,
        can_add: row.can_add === true,
        can_edit: row.can_edit === true,
        can_delete: row.can_delete === true,
        can_manage: row.can_manage === true
      };
    }

    // Fill in default false for any module without explicit entries
    for (const m of modules) {
      if (!permissions[m.code]) {
        permissions[m.code] = {
          can_view: false,
          can_add: false,
          can_edit: false,
          can_delete: false,
          can_manage: false
        };
      }
    }

    // Filter accessible modules where can_view is true
    const accessibleModules = modules.filter(m => permissions[m.code]?.can_view === true);

    return {
      roles: roleCodes,
      roleDetails: roles,
      permissions,
      accessibleModules
    };
  },

  async checkUserPermission(userId, moduleCode, action = 'can_view') {
    const { permissions, roles } = await this.getUserRolesAndPermissions(userId);
    if (roles.includes('SUPER_ADMIN')) return true;
    const modPerm = permissions[moduleCode];
    if (!modPerm) return false;
    return modPerm[action] === true || modPerm.can_manage === true;
  },

  // Users with Roles List
  async getAllUsersWithRoles() {
    const res = await pool.query(`
      SELECT u.id, u.username, u.role as primary_role, u.hotel_id, u.full_name, u.email, u.status,
             h.name as hotel_name, h.slug as hotel_slug,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', r.id,
                   'code', r.code,
                   'name', r.name
                 )
               ) FILTER (WHERE r.id IS NOT NULL), '[]'::json
             ) as assigned_roles
      FROM app_users u
      LEFT JOIN hotels h ON u.hotel_id = h.id
      LEFT JOIN rbac_user_roles ur ON u.id = ur.user_id
      LEFT JOIN rbac_roles r ON ur.role_id = r.id
      GROUP BY u.id, h.name, h.slug
      ORDER BY u.id ASC;
    `);
    return res.rows;
  },

  async assignUserRoles(userId, roleIds = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Remove current roles
      await client.query('DELETE FROM rbac_user_roles WHERE user_id = $1;', [userId]);

      // Insert new roles
      for (const rId of roleIds) {
        await client.query(`
          INSERT INTO rbac_user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [userId, rId]);
      }

      // Update primary role in app_users
      if (roleIds.length > 0) {
        const primaryRole = await client.query('SELECT code FROM rbac_roles WHERE id = $1;', [roleIds[0]]);
        if (primaryRole.rows.length > 0) {
          await client.query('UPDATE app_users SET role = $1 WHERE id = $2;', [primaryRole.rows[0].code, userId]);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async createUserWithRoles({ username, password, roleIds = [], hotelId = null, fullName = '', email = '' }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Determine primary role code
      let primaryRole = 'STAFF';
      if (roleIds.length > 0) {
        const rCheck = await client.query('SELECT code FROM rbac_roles WHERE id = $1;', [roleIds[0]]);
        if (rCheck.rows.length > 0) primaryRole = rCheck.rows[0].code;
      }

      const userRes = await client.query(`
        INSERT INTO app_users (username, password, role, hotel_id, full_name, email, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
        RETURNING id, username, role, hotel_id, full_name, email, status;
      `, [username.trim(), password.trim(), primaryRole, hotelId || null, fullName || '', email || '']);

      const newUser = userRes.rows[0];

      for (const rId of roleIds) {
        await client.query(`
          INSERT INTO rbac_user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [newUser.id, rId]);
      }

      await client.query('COMMIT');
      return newUser;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
