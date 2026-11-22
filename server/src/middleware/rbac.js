import { rbacDb } from '../rbacDb.js';

/**
 * Middleware to enforce granular role-based permissions at the route level.
 * @param {string} moduleCode - The module identifier (e.g. 'BOOKINGS', 'ROOMS', 'FINANCIALS', 'HOTELS')
 * @param {'can_view'|'can_add'|'can_edit'|'can_delete'|'can_manage'} action - Action to verify
 */
export function requirePermission(moduleCode, action = 'can_view') {
  return async (req, res, next) => {
    // RBAC Commented for LayBhari focus: Allow all requests to proceed directly without RBAC rejection
    return next();

    /*
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.user_id || req.user.id;
    const userRole = req.user.role;

    // Super Admin has universal wildcard access
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    try {
      const hasPerm = await rbacDb.checkUserPermission(userId, moduleCode, action);
      if (!hasPerm) {
        return res.status(403).json({
          error: `Access Denied: Missing '${action}' permission for '${moduleCode}'. Contact your Super Admin.`
        });
      }
      next();
    } catch (err) {
      console.error('RBAC permission check error:', err.message);
      res.status(500).json({ error: 'Failed to verify RBAC authorization' });
    }
    */
  };
}
