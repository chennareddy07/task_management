import jwt from 'jsonwebtoken';

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

export const createAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, name: user.name, type: 'access' },
    getRequiredEnv('JWT_ACCESS_SECRET'),
    { expiresIn: '15m' }
  );

export const createRefreshToken = (user, tokenId) =>
  jwt.sign(
    { sub: user.id, tokenId, type: 'refresh' },
    getRequiredEnv('JWT_REFRESH_SECRET'),
    { expiresIn: '7d' }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, getRequiredEnv('JWT_ACCESS_SECRET'));

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getRequiredEnv('JWT_REFRESH_SECRET'));
