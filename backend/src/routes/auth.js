import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from '../utils/tokens.js';

const router = Router();
const refreshCookieName = 'refreshToken';
const refreshTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const authValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 })
];

const sendValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid request', errors: errors.array() });
  }
  return next();
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const cookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: process.env.COOKIE_SAME_SITE || 'none',
  ...(process.env.COOKIE_DOMAIN
    ? { domain: process.env.COOKIE_DOMAIN }
    : {}),
  maxAge: refreshTokenLifetimeMs,
  path: '/auth'
});

const clearCookieOptions = () => {
  const { maxAge, ...options } = cookieOptions();
  return options;
};

const issueTokenPair = async (user) => {
  const tokenId = crypto.randomUUID();
  const refreshToken = createRefreshToken(user, tokenId);

  await RefreshToken.create({
    tokenId,
    tokenHash: hashToken(refreshToken),
    user: user.id,
    expiresAt: new Date(Date.now() + refreshTokenLifetimeMs)
  });

  return {
    accessToken: createAccessToken(user),
    refreshToken
  };
};

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 128 }),
    body('name').isString().trim().isLength({ min: 1, max: 100 })
  ],
  sendValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      const existingUser = await User.exists({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already registered' });
      }

      const user = await User.create({
        email,
        name,
        password: await bcrypt.hash(password, 12)
      });
      const tokens = await issueTokenPair(user);

      res.cookie(refreshCookieName, tokens.refreshToken, cookieOptions());
      return res.status(201).json({
        accessToken: tokens.accessToken,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/login',
  authValidation,
  sendValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      const passwordMatches = user
        ? await bcrypt.compare(password, user.password)
        : false;

      if (!user || !passwordMatches) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const tokens = await issueTokenPair(user);
      res.cookie(refreshCookieName, tokens.refreshToken, cookieOptions());
      return res.json({
        accessToken: tokens.accessToken,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/refresh', async (req, res, next) => {
  try {
    const currentToken = req.cookies?.[refreshCookieName];
    if (!currentToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(currentToken);
    if (payload.type !== 'refresh' || !payload.sub || !payload.tokenId) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokenRecord = await RefreshToken.findOneAndUpdate(
      {
        tokenId: payload.tokenId,
        tokenHash: hashToken(currentToken),
        user: payload.sub,
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Refresh token is invalid or revoked' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const tokens = await issueTokenPair(user);
    res.cookie(refreshCookieName, tokens.refreshToken, cookieOptions());
    return res.json({
      accessToken: tokens.accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const currentToken = req.cookies?.[refreshCookieName];
    if (currentToken) {
      await RefreshToken.findOneAndUpdate(
        { tokenHash: hashToken(currentToken), revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    res.clearCookie(refreshCookieName, clearCookieOptions());
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
