const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];

    // if (!token) {
    //   return res.status(401).json({ error: 'Unauthorized: Bearer token is missing' });
    // }

    jwt.verify(authHeader, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
      }
      req.id = user;
    });
    next();
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = authMiddleware;