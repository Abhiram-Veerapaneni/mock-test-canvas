import jwt from 'jsonwebtoken';

/**
 * Generates JWT token and attaches HTTP-only cookie to the response
 * @param {Object} res - Express response object
 * @param {string} userId - User Mongoose ObjectID
 * @returns {string} token - Signed JWT string
 */
export const generateToken = (res, userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'proctormock_default_jwt_secret',
    { expiresIn: '30d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in ms
  });

  return token;
};
