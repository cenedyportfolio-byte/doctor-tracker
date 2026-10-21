import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/api-error.js';
import { User } from '../users/user.model.js';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// The Next.js proxy verifies tokens with the same issuer/audience before rendering pages.
const ISSUER = 'doctor-tracker-api';
const AUDIENCE = 'doctor-tracker';
const secret = new TextEncoder().encode(env.JWT_SECRET);

// Compared against when the email is unknown so both branches cost one bcrypt round,
// which keeps response timing from revealing which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-placeholder', 12);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function signSessionToken(user: SessionUser): Promise<{ token: string; expiresAt: Date }> {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);

  const { payload } = await jwtVerify(token, secret);
  return { token, expiresAt: new Date((payload.exp ?? 0) * 1000) };
}

/** Returns the user id from a valid token, or throws 401. */
export async function verifySessionToken(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (!payload.sub) throw new Error('Missing subject');
    return payload.sub;
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }
}

export async function authenticateCredentials(email: string, password: string): Promise<SessionUser> {
  const user = await User.findOne({ email }).select('+passwordHash').lean();
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.active) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

/** Loads the current state of a user so revoked or demoted accounts lose access immediately. */
export async function findSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await User.findById(userId).select('name email role active').lean();
  if (!user || !user.active) return null;
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}
