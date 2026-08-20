const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { dbIsConnected } = require('../config/db');
const { DEMO_USERS } = require('../utils/demoAuth');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'Authentication required' });
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'floodguard_super_secret_change_me');
    let user = null;
    if (dbIsConnected()) user = await User.findById(decoded.id).select('-password');
    if (!user) user = DEMO_USERS.find(u => u.id === decoded.id || u._id === decoded.id);
    if (!user) return res.status(401).json({ success:false, message:'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success:false, message:'Invalid or expired token' });
  }
}

const permit = (...roles) => (req,res,next) => roles.includes(req.user?.role) ? next() : res.status(403).json({success:false,message:'Insufficient permissions'});
module.exports = { protect, permit };
