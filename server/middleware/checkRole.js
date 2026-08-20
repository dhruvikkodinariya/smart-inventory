const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Forbidden: User role not found' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}` });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error during role check' });
    }
  };
};

module.exports = checkRole;
