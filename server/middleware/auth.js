const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('AUTH HIT - URL:', req.url);
  console.log('AUTH HIT - Header:', req.headers['authorization']?.slice(0, 30));
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;