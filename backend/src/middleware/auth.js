import { verifyAccessToken } from '../utils/tokens.js';

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim() || null;
};

export const requireAuth = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access' || !payload.sub) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access token expired',
        code: 'ACCESS_TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({ message: 'Invalid access token' });
  }
};
