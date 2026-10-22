import { Router } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/api-error.js';
import { authenticate } from '../../middleware/auth.js';
import { login, logout, me } from './auth.controller.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email: unknown = req.body?.email;
    return `${ipKeyGenerator(req.ip ?? '')}|${typeof email === 'string' ? email.trim().toLowerCase() : ''}`;
  },
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) =>
    next(new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts. Try again in 15 minutes.')),
});

export const authRouter = Router();

authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
