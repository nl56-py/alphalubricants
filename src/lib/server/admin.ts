import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { revalidateTag } from 'next/cache';
import { db } from './db';
import { requireUser, userSelect } from './auth';
import { ApiError, requireDatabase, validateOrigin } from './http';
import { contentSchema, productSchema, promoSchema, passwordSchema } from './validation';

export const riderSelect = { ...userSelect, active: true, createdAt: true } as const;
const riderSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(191).transform(s => s.toLowerCase()), phone: z.string().max(30).nullable().optional(), active: z.boolean().default(true), password: passwordSchema.optional() });
export function pagination(request: NextRequest) {
  const page = z.coerce.number().int().min(1).max(100000).parse(request.nextUrl.searchParams.get('page') || 1);
  const pageSize = z.coerce.number().int().min(1).max(100).parse(request.nextUrl.searchParams.get('pageSize') || 30);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
export async function adminGuard(request: NextRequest, write = false) {
  if (write) validateOrigin(request);
  requireDatabase();
  return requireUser(['ADMIN']);
}
export function resourceName(raw: string) { return z.enum(['products', 'content', 'promos', 'riders']).parse(raw); }
export async function listResource(resource: string, request: NextRequest) {
  const { page, pageSize, skip, take } = pagination(request);
  const q = request.nextUrl.searchParams.get('q')?.slice(0, 100);
  if (resource === 'products') {
    const where = q ? { name: { contains: q } } : {};
    const [items, total] = await db.$transaction([db.product.findMany({ where, skip, take, orderBy: { updatedAt: 'desc' } }), db.product.count({ where })]);
    return { items, total, page, pageSize };
  }
  if (resource === 'content') {
    const type = request.nextUrl.searchParams.get('type');
    const where = { ...(q ? { title: { contains: q } } : {}), ...(type ? { type: z.enum(['HERO', 'BLOG', 'GALLERY', 'VIDEO', 'OFFER', 'REVIEW', 'SOCIAL', 'RIDER_PROFILE']).parse(type) } : {}) };
    const [items, total] = await db.$transaction([db.content.findMany({ where, skip, take, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }), db.content.count({ where })]);
    return { items, total, page, pageSize };
  }
  if (resource === 'promos') {
    const where = q ? { code: { contains: q } } : {};
    const [items, total] = await db.$transaction([db.promo.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { rider: { select: userSelect } } }), db.promo.count({ where })]);
    return { items, total, page, pageSize };
  }
  const where: Prisma.UserWhereInput = { role: 'RIDER', ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}) };
  const [items, total] = await db.$transaction([db.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: riderSelect }), db.user.count({ where })]);
  return { items, total, page, pageSize };
}
export async function mutateResource(resource: string, actorId: string, raw: unknown, id?: string, remove = false) {
  const result = await db.$transaction(async tx => {
    let item: unknown;
    if (resource === 'products') {
      const current = id ? await tx.product.findUniqueOrThrow({ where: { id } }) : {};
      if (remove) item = await tx.product.update({ where: { id }, data: { active: false } });
      else { const data = productSchema.parse({ ...current, ...(raw as object) }); item = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data }); }
    } else if (resource === 'content') {
      const current = id ? await tx.content.findUniqueOrThrow({ where: { id } }) : {};
      if (remove) item = await tx.content.delete({ where: { id } });
      else {
        const data = contentSchema.parse({ ...current, ...(raw as object) });
        if (data.type === 'VIDEO' && !data.youtubeUrl && !data.videoUrl) throw new ApiError(400, 'Upload a video or provide a YouTube link.');
        if (data.published && data.type === 'REVIEW' && !data.body?.trim() && !data.excerpt?.trim()) throw new ApiError(400, 'Add the customer?s review before publishing.');
        if (data.published && data.type === 'SOCIAL' && !data.link) throw new ApiError(400, 'Add the original social post or profile link.');
        if (['HERO', 'GALLERY'].includes(data.type) && !data.image) throw new ApiError(400, 'This content requires an image.');
        item = id ? await tx.content.update({ where: { id }, data }) : await tx.content.create({ data });
      }
    } else if (resource === 'promos') {
      const current = id ? await tx.promo.findUniqueOrThrow({ where: { id } }) : {};
      if (remove) item = await tx.promo.update({ where: { id }, data: { active: false } });
      else {
        const data = promoSchema.parse({ ...current, ...(raw as object) });
        if (data.type === 'PERCENT' && data.value > 100) throw new ApiError(400, 'Percent discounts cannot exceed 100.');
        if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) throw new ApiError(400, 'Expiry must follow the start date.');
        if (data.riderId && !(await tx.user.findFirst({ where: { id: data.riderId, role: 'RIDER', active: true } }))) throw new ApiError(400, 'Choose an active rider.');
        item = id ? await tx.promo.update({ where: { id }, data }) : await tx.promo.create({ data });
      }
    } else {
      const current = id ? await tx.user.findFirst({ where: { id, role: 'RIDER' }, select: riderSelect }) : {};
      if (!current) throw new ApiError(404, 'Rider not found.');
      if (remove) { item = await tx.user.update({ where: { id }, data: { active: false }, select: riderSelect }); await tx.session.deleteMany({ where: { userId: id } }); }
      else {
        const { password, ...data } = riderSchema.parse({ ...current, ...(raw as object) });
        if (!id && !password) throw new ApiError(400, 'A password of at least 10 characters is required.');
        const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
        item = id ? await tx.user.update({ where: { id }, data: { ...data, ...(passwordHash ? { passwordHash } : {}) }, select: riderSelect }) : await tx.user.create({ data: { ...data, passwordHash: passwordHash!, role: 'RIDER' }, select: riderSelect });
        if (id && (passwordHash || !data.active)) await tx.session.deleteMany({ where: { userId: id } });
      }
    }
    await tx.auditLog.create({ data: { actorId, action: `${resource.toUpperCase()}_${remove ? 'DELETE' : id ? 'UPDATE' : 'CREATE'}`, entityId: (item as { id: string }).id } });
    return item;
  });
  if (resource === 'products' || resource === 'content') revalidateTag(resource, { expire: 0 });
  return result;
}
