import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

test('MySQL checkout atomically reserves stock, limits promo use and deduplicates retries', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { db } = await import('../src/lib/server/db');
  const { checkout } = await import('../src/lib/server/checkout');
  const key = randomUUID(); const userIds: string[] = []; const productIds: string[] = []; let promoId: string | undefined;
  const shipping = { name: 'Integration Test', phone: '9800000000', address: 'Test address', city: 'Kathmandu' };
  try {
    for (let i = 0; i < 2; i++) { const user = await db.user.create({ data: { name: 'Test', email: `${key}-${i}@example.invalid`, passwordHash: 'not-a-real-password' } }); userIds.push(user.id); }
    for (let i = 0; i < 3; i++) { const product = await db.product.create({ data: { slug: `${key}-${i}`, name: 'Integration test oil', description: 'Test', category: 'Test', viscosity: '', size: '1L', pricePaisa: 100000, stock: 1, image: '/test.webp', specs: {} } }); productIds.push(product.id); }
    const stockResults = await Promise.allSettled(userIds.map(userId => checkout(userId, { items: [{ productId: productIds[0], quantity: 1 }], shipping })));
    assert.equal(stockResults.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: productIds[0] } })).stock, 0);
    const promo = await db.promo.create({ data: { code: `TEST-${key.slice(0, 12).toUpperCase()}`, type: 'PERCENT', value: 10, maxUses: 1 } }); promoId = promo.id;
    const promoResults = await Promise.allSettled(userIds.map((userId, i) => checkout(userId, { items: [{ productId: productIds[i + 1], quantity: 1 }], promoCode: promo.code, shipping, idempotencyKey: `${key}-${i}` })));
    assert.equal(promoResults.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((await db.promo.findUniqueOrThrow({ where: { id: promo.id } })).usedCount, 1);
    const winner = promoResults.findIndex(result => result.status === 'fulfilled');
    const repeat = await checkout(userIds[winner], { items: [{ productId: productIds[winner + 1], quantity: 1 }], promoCode: promo.code, shipping, idempotencyKey: `${key}-${winner}` });
    assert.equal(repeat.order?.id, (promoResults[winner] as PromiseFulfilledResult<typeof repeat>).value.order?.id);
    assert.equal(await db.order.count({ where: { userId: { in: userIds } } }), 2);
  } finally {
    await db.order.deleteMany({ where: { userId: { in: userIds } } });
    await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    if (promoId) await db.promo.delete({ where: { id: promoId } });
    await db.product.deleteMany({ where: { id: { in: productIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  }
});
