import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { Role } from '@prisma/client';
import { db, hasDatabase } from './db';
import { ApiError } from './http';

export const COOKIE = 'alpha_session';
export const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours max idle duration
const SESSION_RENEWAL_THRESHOLD_MS = 15 * 60 * 1000; // Extend if active after 15 minutes

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
export const userSelect = { id: true, name: true, email: true, role: true, phone: true } as const;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    // Omitting `expires` and `maxAge` makes this a true browser Session Cookie:
    // the browser automatically destroys it when the browser/window is closed.
  };
}

export function getClearCookieOptions() {
  return {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

export async function currentUser() {
  if (!hasDatabase()) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) {
    if (session) {
      await db.session.deleteMany({ where: { tokenHash: hash(token) } }).catch(() => {});
    }
    try {
      jar.set(COOKIE, '', getClearCookieOptions());
      jar.delete({ name: COOKIE, path: '/' });
    } catch {
      // In read-only cookie contexts, ignore write errors
    }
    return null;
  }

  // Sliding session renewal: if more than 15 minutes of active usage has passed, refresh idle expiry
  const remainingMs = session.expiresAt.getTime() - Date.now();
  if (remainingMs < SESSION_IDLE_TIMEOUT_MS - SESSION_RENEWAL_THRESHOLD_MS) {
    const freshExpiry = new Date(Date.now() + SESSION_IDLE_TIMEOUT_MS);
    await db.session.update({
      where: { id: session.id },
      data: { expiresAt: freshExpiry },
    }).catch(() => {});
  }

  const { id, name, email, role, phone } = session.user;
  return { id, name, email, role, phone };
}

export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user) throw new ApiError(401, 'Please sign in to continue.');
  if (roles && !roles.includes(user.role)) throw new ApiError(403, 'You do not have access to this action.');
  return user;
}

export async function createSession(userId: string) {
  const jar = await cookies();
  const existingToken = jar.get(COOKIE)?.value;
  if (hasDatabase()) {
    // Invalidate prior sessions for this user to enforce dynamic single-session rotation
    await db.session.deleteMany({
      where: {
        OR: [
          { userId },
          ...(existingToken ? [{ tokenHash: hash(existingToken) }] : []),
        ],
      },
    }).catch(() => {});
  }

  // Generate fresh, dynamic cryptographically secure 32-byte session token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_IDLE_TIMEOUT_MS);
  await db.session.create({ data: { tokenHash: hash(token), userId, expiresAt } });

  const cookieOptions = getSessionCookieOptions();
  jar.set(COOKIE, token, cookieOptions);
  return { token, cookieOptions };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && hasDatabase()) {
    try {
      await db.session.deleteMany({ where: { tokenHash: hash(token) } });
    } catch {
      // ignore
    }
  }
  const clearOptions = getClearCookieOptions();
  try {
    jar.set(COOKIE, '', clearOptions);
    jar.delete({ name: COOKIE, path: '/' });
  } catch {
    // ignore
  }
  return clearOptions;
}

