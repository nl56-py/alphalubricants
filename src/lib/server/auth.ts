import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { Role } from '@prisma/client';
import { db, hasDatabase } from './db';
import { ApiError } from './http';

const COOKIE = 'alpha_session';
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
export const userSelect = { id: true, name: true, email: true, role: true, phone: true } as const;
export async function currentUser() {
  if (!hasDatabase()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
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
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hash(token), userId, expiresAt: expires } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires });
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && hasDatabase()) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(COOKIE);
}
