import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { currentUser } from '../../middleware/auth.js';
import { parse } from '../../lib/validation.js';
import { authenticateCredentials, signSessionToken } from './auth.service.js';

const loginBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Password is required').max(128),
});

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
};

export async function login(req: Request, res: Response) {
  const { email, password } = parse(loginBody, req.body);
  const user = await authenticateCredentials(email, password);
  const { token, expiresAt } = await signSessionToken(user);

  res.cookie(env.COOKIE_NAME, token, { ...baseCookieOptions, expires: expiresAt });
  res.json({ data: { user, expiresAt } });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME, baseCookieOptions);
  res.status(204).end();
}

export function me(req: Request, res: Response) {
  res.json({ data: { user: currentUser(req) } });
}
