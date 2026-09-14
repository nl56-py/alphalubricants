import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/server/db';
import { createSession } from '@/lib/server/auth';
import { ApiError, rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
const schema = z.object({ email: z.string().trim().email().max(191).transform(s => s.toLowerCase()), password: z.string().min(1).max(72).refine(value => new TextEncoder().encode(value).length <= 72) });
export const POST = route(async request => {
  validateOrigin(request); requireDatabase();
  const input = schema.parse(await readJson(request));
  await rateLimit(request, 'login-ip', 30);
  await rateLimit(request, 'login-account', 8, input.email);
  const user = await db.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxIZviF.jM4MoBQwoTHMP/xGnB.');
  if (!user || !user.active || !valid) {
    if (user) {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          entityId: user.id,
          details: { email: input.email },
        },
      }).catch(() => {});
    }
    throw new ApiError(401, 'Email or password is incorrect.');
  }
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});
