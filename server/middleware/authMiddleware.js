const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load env variables
const SECRET_KEY = process.env.JWT_SECRET;

console.log("🔐 Middleware using JWT secret:", SECRET_KEY);

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Token received:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("✅ Decoded token:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;
