import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../config/constants.js';
import { env } from '../config/env.js';
import { ApiError } from '../lib/api-error.js';
import {
  findSessionUser,
  verifySessionToken,
  type SessionUser,
} from '../modules/auth/auth.service.js';

/** Requires a valid session cookie and attaches the current user to `req.user`. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[env.COOKIE_NAME];
  if (typeof token !== 'string' || !token) throw ApiError.unauthorized();

  const userId = await verifySessionToken(token);
  const user = await findSessionUser(userId);
  if (!user) throw ApiError.unauthorized('Your account is no longer active');

  req.user = user;
  next();
}

/** Role-based authorization. Must run after `authenticate`. */
function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const requireAdmin = authorize('admin');

/**
 * Reads are open to every signed-in user; every other method requires the admin role.
 * Mounted once on the API router, so a new write route cannot forget the check.
 */
export function requireAdminForWrites(req: Request, res: Response, next: NextFunction) {
  if (READ_METHODS.has(req.method)) return next();
  return requireAdmin(req, res, next);
}

export function currentUser(req: Request): SessionUser {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}
