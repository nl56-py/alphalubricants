import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from './db';
import { defaultSettings } from './public-data';
import { checkoutSchema } from './validation';
import { ApiError } from './http';
import { calculateDiscount, calculateShipping } from './pricing';

export async function checkout(userId: string, input: z.infer<typeof checkoutSchema>, quoteOnly = false) {
  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  if ([...quantities.values()].some(quantity => quantity > 50)) throw new ApiError(400, 'Maximum 50 units per product.');
  return db.$transaction(async tx => {
    if (!quoteOnly && input.idempotencyKey) {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`);
      const previous = await tx.order.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } }, include: { items: true } });
      if (previous) return { subtotalPaisa: previous.subtotalPaisa, discountPaisa: previous.discountPaisa, shippingPaisa: previous.shippingPaisa, totalPaisa: previous.totalPaisa, order: previous };
    }
    // Lock in a deterministic order to serialize competing stock and promo consumption.
    const ids = [...quantities.keys()].sort();
    if (!quoteOnly) for (const id of ids) await tx.$queryRaw(Prisma.sql`SELECT id FROM Product WHERE id = ${id} FOR UPDATE`);
    const products = await tx.product.findMany({ where: { id: { in: ids }, active: true } });
    if (products.length !== ids.length) throw new ApiError(400, 'One or more products are no longer available.');
    for (const product of products) if (product.stock < quantities.get(product.id)!) throw new ApiError(409, `${product.name} has insufficient stock.`);
    const subtotalPaisa = products.reduce((sum, product) => sum + product.pricePaisa * quantities.get(product.id)!, 0);
    if (subtotalPaisa > 1000000000) throw new ApiError(400, 'Please contact Alpha for a bulk order of this size.');
    const code = input.promoCode?.trim().toUpperCase();
    if (code && !quoteOnly) await tx.$queryRaw(Prisma.sql`SELECT id FROM Promo WHERE code = ${code} FOR UPDATE`);
    const promo = code ? await tx.promo.findUnique({ where: { code }, include: { rider: { select: { active: true, role: true } } } }) : null;
    if (code && !promo) throw new ApiError(400, 'This promo code was not found.');
    let discountPaisa = 0;
    try { discountPaisa = calculateDiscount(subtotalPaisa, promo); } catch (error) { throw new ApiError(400, (error as Error).message); }
    const setting = await tx.setting.findUnique({ where: { key: 'site' } });
    const settings = { ...defaultSettings, ...(setting?.value as Partial<typeof defaultSettings> ?? {}) };
    const shippingPaisa = calculateShipping(subtotalPaisa, settings);
    const totals = { subtotalPaisa, discountPaisa, shippingPaisa, totalPaisa: subtotalPaisa - discountPaisa + shippingPaisa };
    if (quoteOnly) return { ...totals, order: null };
    for (const product of products) {
      const quantity = quantities.get(product.id)!;
      const changed = await tx.product.updateMany({ where: { id: product.id, stock: { gte: quantity }, active: true }, data: { stock: { decrement: quantity } } });
      if (changed.count !== 1) throw new ApiError(409, 'Stock changed. Please refresh your cart.');
    }
    if (promo) await tx.promo.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
    const referredById = promo?.rider?.active && promo.rider.role === 'RIDER' ? promo.riderId : null;
    const order = await tx.order.create({ data: { number: `AL-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`, userId, idempotencyKey: input.idempotencyKey, promoId: promo?.id, promoCode: promo?.code, riderId: referredById, referredById, shipping: input.shipping, ...totals, items: { create: products.map(product => ({ productId: product.id, name: product.name, image: product.image, unitPricePaisa: product.pricePaisa, quantity: quantities.get(product.id)! })) } }, include: { items: true } });
    await tx.auditLog.create({ data: { actorId: userId, action: 'ORDER_CREATED', entityId: order.id } });
    return { ...totals, order };
  // MySQL's default REPEATABLE READ could reuse a pre-lock snapshot after waiting
  // on a promo. READ COMMITTED makes the validation observe the locked row's latest usage.
  }, { maxWait: 5000, timeout: 15000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
