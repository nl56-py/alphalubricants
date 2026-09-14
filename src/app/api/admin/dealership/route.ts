import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dealershipStatuses } from '@/lib/dealership';
import { adminGuard, pagination } from '@/lib/server/admin';
import { db } from '@/lib/server/db';
import { readJson, route } from '@/lib/server/http';

export const GET = route(async request => {
  await adminGuard(request);
  const { page, pageSize, skip, take } = pagination(request);
  const status = request.nextUrl.searchParams.get('status');
  const q = request.nextUrl.searchParams.get('q')?.slice(0, 100);
  const where = { ...(status ? { status: z.enum(dealershipStatuses).parse(status) } : {}), ...(q ? { OR: [{ name: { contains: q } }, { businessName: { contains: q } }, { phone: { contains: q } }, { address: { contains: q } }] } : {}) };
  const [items, total] = await db.$transaction([db.dealershipEnquiry.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }), db.dealershipEnquiry.count({ where })]);
  return NextResponse.json({ items, total, page, pageSize });
});

export const PATCH = route(async request => {
  const actor = await adminGuard(request, true);
  const { id, ...data } = z.object({ id: z.string().cuid(), status: z.enum(dealershipStatuses), adminNotes: z.string().trim().max(5000) }).parse(await readJson(request));
  const item = await db.$transaction(async tx => {
    const updated = await tx.dealershipEnquiry.update({ where: { id }, data });
    await tx.auditLog.create({ data: { actorId: actor.id, action: 'DEALERSHIP_UPDATE', entityId: id, details: { status: data.status } } });
    return updated;
  });
  return NextResponse.json({ item });
});
