import "server-only";
import { jwtVerify, type JWTPayload } from "jose";

/**
 * Session verification for the Next.js proxy. The Express API issues the JWT (HS256) and
 * sets it as an httpOnly cookie; the web app only ever verifies it.
 */
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "dt_session";

// Must match the issuer/audience the API signs with (backend/src/modules/auth/auth.service.ts).
const ISSUER = "doctor-tracker-api";
const AUDIENCE = "doctor-tracker";

let secret: Uint8Array | undefined;

function getSecret(): Uint8Array {
  if (!secret) {
    const value = process.env.JWT_SECRET;
    if (!value || value.length < 32) {
      throw new Error("JWT_SECRET is missing or shorter than 32 characters. Copy it from backend/.env.");
    }
    secret = new TextEncoder().encode(value);
  }
  return secret;
}

export interface SessionClaims extends JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    return payload as SessionClaims;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("JWT_SECRET")) throw error;
    return null;
  }
}
