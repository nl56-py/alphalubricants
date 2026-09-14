import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/server/db';
import { COOKIE, createSession, userSelect } from '@/lib/server/auth';
import { rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
import { passwordSchema } from '@/lib/server/validation';
const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(191).transform(s => s.toLowerCase()), password: passwordSchema, phone: z.string().min(7).max(30).optional() });
export const POST = route(async request => {
  validateOrigin(request); requireDatabase();
  await rateLimit(request, 'register', 12);
  const { password, ...input } = schema.parse(await readJson(request));
  const user = await db.user.create({ data: { ...input, passwordHash: await bcrypt.hash(password, 12), role: 'CUSTOMER' }, select: userSelect });
  const { token, cookieOptions } = await createSession(user.id);
  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set(COOKIE, token, cookieOptions);
  return response;
});
