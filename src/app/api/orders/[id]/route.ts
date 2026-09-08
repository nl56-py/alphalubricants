import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/server/db';
import { requireUser, userSelect } from '@/lib/server/auth';
import { ApiError, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
import { canTransition, orderScope } from '@/lib/server/order-policy';
const schema = z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(), riderId: z.string().min(1).max(100).nullable().optional() }).refine(data => data.status !== undefined || data.riderId !== undefined, 'Choose a status or rider.');
export const GET = route(async (_request, context) => {
  requireDatabase(); const user = await requireUser(); const { id } = await context.params;
  const order = await db.order.findFirst({ where: { id, ...orderScope(user) }, include: { items: true, rider: { select: userSelect } } });
  if (!order) throw new ApiError(404, 'Order not found.'); return NextResponse.json({ order });
});
export const PATCH = route(async (request, context) => {
  validateOrigin(request); requireDatabase(); const user = await requireUser(['ADMIN', 'RIDER']); const { id } = await context.params;
  const input = schema.parse(await readJson(request));
  if (user.role === 'RIDER' && input.riderId !== undefined) throw new ApiError(403, 'Only an administrator can assign riders.');
  const order = await db.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM \`Order\` WHERE id = ${id} FOR UPDATE`);
    const existing = await tx.order.findFirst({ where: { id, ...(user.role === 'RIDER' ? { riderId: user.id } : {}) }, include: { items: true } });
    if (!existing) throw new ApiError(404, 'Order not found.');
    if (input.status && !canTransition(existing.status, input.status, user.role)) throw new ApiError(409, `Cannot change ${existing.status.toLowerCase()} to ${input.status.toLowerCase()}.`);
    if (input.riderId !== undefined && ['CANCELLED', 'DELIVERED'].includes(existing.status)) throw new ApiError(409, 'Completed orders cannot be reassigned.');
    if (input.riderId && !await tx.user.findFirst({ where: { id: input.riderId, active: true, role: 'RIDER' } })) throw new ApiError(400, 'Choose an active rider.');
    if (input.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      for (const item of [...existing.items].sort((a, b) => a.productId.localeCompare(b.productId))) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      if (existing.promoId) await tx.promo.updateMany({ where: { id: existing.promoId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    const updated = await tx.order.update({ where: { id }, data: input, include: { items: true, user: { select: userSelect }, rider: { select: userSelect } } });
    await tx.auditLog.create({ data: { actorId: user.id, action: 'ORDER_UPDATE', entityId: id, details: { previousStatus: existing.status, ...input } } });
    return updated;
  });
  revalidateTag('products', { expire: 0 }); return NextResponse.json({ order });
});
