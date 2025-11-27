const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET || 'your jwt secret';
  const expiresIn = process.env.JWT_EXPIRY || '2 days';
  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
};

const generateEmailToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET_EMAIL || 'your jwt secret';
  const expiresIn = process.env.JWT_EXPIRY_EMAIL ;
  return {
    expiresAt: new Date(Date.now() + Number(expiresIn)),
    token: jwt.sign(
      user,
      jwtSecret,
      { expiresIn }
    )
  };
}

const verifyEmailToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_EMAIL || 'your_jwt_secret');
};

module.exports = {
  generateToken,
  verifyToken,
  generateEmailToken,
  verifyEmailToken
};