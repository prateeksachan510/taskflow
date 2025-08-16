// src/middleware/auth.js

import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // Get token from the header
  const authHeader = req.header('Authorization');

  // Check if no token
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // The token is expected to be in the format "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload to the request object
    req.user = decoded;
    next(); // Move on to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware;