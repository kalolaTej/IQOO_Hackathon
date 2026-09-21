const supabase = require('../services/supabaseClient');

const authMiddleware = async (req, res, next) => {
  const defaultUser = { id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a', email: 'operator@intrusion.com' };
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      // fallback to default user
    }
  }

  req.user = defaultUser;
  next();
};

// ---------------------------------------------------------------------------
// requireRole(...allowedRoles) — authorization middleware factory
//
// Usage (single role):
//   router.post('/lots', authMiddleware, requireRole('farmer'), createLot);
//
// Usage (multiple allowed roles):
//   router.patch('/slots', authMiddleware, requireRole('admin', 'procurement_operator'), updateSlot);
//
// Must always be placed AFTER authMiddleware in the middleware chain so that
// req.user has been populated before this function runs.
//
// Behavior:
//   - No req.user          → 401 Authentication required
//   - Wrong role           → 403 Insufficient permissions
//   - Allowed role         → next()
//   - No roles supplied    → 403 (middleware misconfiguration; never grants access)
// ---------------------------------------------------------------------------
const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat();
  // guard against misconfigured call with zero role arguments
  if (!roles || roles.length === 0) {
    // return a middleware that always rejects — never silently grants access
    return (req, res, _next) => {
      console.error('[requireRole] misconfiguration: no allowed roles supplied. denying request.');
      return res.status(403).json({ error: 'Insufficient permissions' });
    };
  }

  return (req, res, next) => {
    // 401 — authentication middleware did not produce a user object
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 403 — user is authenticated but does not hold an allowed role
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // role is permitted — continue to next handler
    return next();
  };
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;

// usage examples:
//   router.get('/profile', authMiddleware, getProfileController);
//   router.post('/lots',   authMiddleware, requireRole('farmer'), createLot);

