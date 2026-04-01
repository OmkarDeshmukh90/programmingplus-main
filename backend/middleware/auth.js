const { requireAuth } = require('@clerk/express');
const User = require('../models/User');

const verifyToken = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const user = await User.findOne({ clerkId: req.auth.userId });
      if (!user) {
        return res.status(403).json({ message: 'User not fully onboarded/synced' });
      }
      req.userId = user._id; 
      next();
    } catch (err) {
      console.error(`[AUTH] Custom translation failed:`, err.message);
      return res.status(403).json({ message: 'Invalid token or sync error' });
    }
  }
];

module.exports = verifyToken;
