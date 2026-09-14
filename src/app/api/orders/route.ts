import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { requireUser, userSelect } from '@/lib/server/auth';
import { requireDatabase, route } from '@/lib/server/http';
import { pagination } from '@/lib/server/admin';
import { orderScope } from '@/lib/server/order-policy';
export const GET = route(async request => {
  requireDatabase(); const user = await requireUser(); const { page, pageSize, skip, take } = pagination(request);
  const rawStatus = request.nextUrl.searchParams.get('status');
  const status = rawStatus ? z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).parse(rawStatus) : undefined;
  const q = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100);
  const where = { AND: [orderScope(user), ...(status ? [{ status }] : []), ...(q ? [{ OR: [{ number: { contains: q } }, { user: { name: { contains: q } } }, { guestName: { contains: q } }, { guestPhone: { contains: q } }] }] : [])] };
  const [items, total] = await db.$transaction([db.order.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { items: true, user: { select: userSelect }, rider: { select: userSelect } } }), db.order.count({ where })]);
  return NextResponse.json({ items, total, page, pageSize });
});
