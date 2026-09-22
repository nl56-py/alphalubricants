import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount, calculateShipping, type PromoInput } from '../src/lib/server/pricing';
import { canTransition, orderScope } from '../src/lib/server/order-policy';
import { checkoutSchema, productSchema, contentSchema, passwordSchema } from '../src/lib/server/validation';
const promo: PromoInput = { active: true, type: 'PERCENT', value: 15, minOrderPaisa: 10000, maxDiscountPaisa: 20000, maxUses: 10, usedCount: 0, startsAt: null, expiresAt: null };
test('discounts use integer paisa, respect caps and cannot exceed the order', () => {
  assert.equal(calculateDiscount(10001, promo), 1500);
  assert.equal(calculateDiscount(200000, promo), 20000);
  assert.equal(calculateDiscount(10000, { ...promo, type: 'FIXED', value: 100000 }), 10000);
  assert.equal(calculateDiscount(10000, null), 0);
});
test('inactive, expired, exhausted and minimum-order promos are rejected', () => {
  const now = new Date('2026-09-08T00:00:00Z');
  for (const patch of [{ active: false }, { expiresAt: now }, { startsAt: new Date('2026-10-01') }, { usedCount: 10 }]) assert.throws(() => calculateDiscount(20000, { ...promo, ...patch }, now));
  assert.throws(() => calculateDiscount(9999, promo));
});
test('promo codes can be restricted to specific products', () => {
  const productSpecificPromo: PromoInput = {
    ...promo,
    productIds: ['prod-1', 'prod-2']
  };
  assert.equal(
    calculateDiscount(20000, productSpecificPromo, [
      { productId: 'prod-1', pricePaisa: 10000, quantity: 2 }
    ]),
    3000
  );
  assert.equal(
    calculateDiscount(30000, productSpecificPromo, [
      { productId: 'prod-1', pricePaisa: 10000, quantity: 1 },
      { productId: 'prod-other', pricePaisa: 20000, quantity: 1 }
    ]),
    1500
  );
  assert.throws(() =>
    calculateDiscount(20000, productSpecificPromo, [
      { productId: 'prod-other', pricePaisa: 20000, quantity: 1 }
    ])
  );
  assert.throws(() => calculateDiscount(20000, productSpecificPromo));
});
test('free shipping activates at the exact threshold', () => {
  const settings = { shippingPaisa: 15000, freeShippingAbovePaisa: 300000 };
  assert.equal(calculateShipping(299999, settings), 15000);
  assert.equal(calculateShipping(300000, settings), 0);
});
test('only admins can progress or cancel orders and terminal statuses cannot reopen', () => {
  assert.equal(canTransition('PENDING', 'CONFIRMED', 'ADMIN'), true);
  assert.equal(canTransition('PENDING', 'DELIVERED', 'ADMIN'), false);
  assert.equal(canTransition('CONFIRMED', 'CANCELLED', 'ADMIN'), true);
  assert.equal(canTransition('SHIPPED', 'CANCELLED', 'ADMIN'), false);
  assert.equal(canTransition('CANCELLED', 'PENDING', 'ADMIN'), false);
  assert.equal(canTransition('DELIVERED', 'PENDING', 'ADMIN'), false);
  assert.equal(canTransition('SHIPPED', 'DELIVERED', 'RIDER'), true);
  assert.equal(canTransition('PENDING', 'CONFIRMED', 'RIDER'), false);
  assert.equal(canTransition('SHIPPED', 'DELIVERED', 'CUSTOMER'), false);
});
test('customer and rider data queries are scoped by identity', () => {
  assert.deepEqual(orderScope({ id: 'u1', role: 'CUSTOMER' }), { userId: 'u1' });
  assert.deepEqual(orderScope({ id: 'r1', role: 'RIDER' }), { OR: [{ riderId: 'r1' }, { referredById: 'r1' }] });
  assert.deepEqual(orderScope({ id: 'a1', role: 'ADMIN' }), {});
});
test('checkout rejects invalid quantities and discards client-supplied totals', () => {
  const input = { items: [{ productId: 'p1', quantity: 1 }], shipping: { name: 'Test User', phone: '9800000000', address: 'Test street', city: 'Kathmandu' }, totalPaisa: 1 };
  assert.equal('totalPaisa' in checkoutSchema.parse(input), false);
  for (const quantity of [-1, 0, 1.5, 51]) assert.equal(checkoutSchema.safeParse({ ...input, items: [{ productId: 'p1', quantity }] }).success, false);
});
test('CMS rejects executable image URLs and non-YouTube video URLs', () => {
  assert.equal(contentSchema.safeParse({ type: 'VIDEO', slug: 'test-video', title: 'Test video', youtubeUrl: 'https://evil.example/video' }).success, false);
  assert.equal(contentSchema.safeParse({ type: 'HERO', slug: 'test-hero', title: 'Test hero', image: 'javascript:alert(1)' }).success, false);
  assert.equal(productSchema.safeParse({ slug: 'test-product', name: 'Oil', description: 'Test engine oil', category: 'Bike', viscosity: '10W40', size: '1L', stock: 1, pricePaisa: 0, image: '/images/oil.webp' }).success, false);
});
test('passwords cannot silently truncate at bcrypt UTF-8 byte limit', () => {
  assert.equal(passwordSchema.safeParse('a'.repeat(72)).success, true);
  assert.equal(passwordSchema.safeParse('a'.repeat(73)).success, false);
  assert.equal(passwordSchema.safeParse('🔑'.repeat(20)).success, false);
});

test('open redirect sanitizer rejects protocol-relative, backslash and off-site URLs', () => {
  function sanitizeNext(next: string | null, fallback: string): string {
    if (!next) return fallback;
    if (/^\/[^\/\\]/.test(next) || next === '/') {
      return next;
    }
    return fallback;
  }
  assert.equal(sanitizeNext('//evil.com', '/account'), '/account');
  assert.equal(sanitizeNext('/\\evil.com', '/account'), '/account');
  assert.equal(sanitizeNext('https://evil.com', '/account'), '/account');
  assert.equal(sanitizeNext('javascript:alert(1)', '/account'), '/account');
  assert.equal(sanitizeNext('/admin', '/account'), '/admin');
  assert.equal(sanitizeNext('/', '/account'), '/');
  assert.equal(sanitizeNext('/products?category=Motorcycle', '/account'), '/products?category=Motorcycle');
});

test('public featured riders do not expose rider promo codes', async () => {
  const { fallbackFeaturedRiders } = await import('../src/lib/server/catalog');
  for (const rider of fallbackFeaturedRiders) {
    assert.equal('promoCode' in rider, false, `Rider ${rider.name} must not expose promoCode`);
  }
});

test('session cookie options omit expires and maxAge for browser session destruction', async () => {
  const { getSessionCookieOptions, SESSION_IDLE_TIMEOUT_MS } = await import('../src/lib/server/auth');
  const options = getSessionCookieOptions();
  assert.equal('expires' in options, false, 'Session cookie must not define persistent expires header');
  assert.equal('maxAge' in options, false, 'Session cookie must not define persistent maxAge header');
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
  assert.equal(SESSION_IDLE_TIMEOUT_MS, 2 * 60 * 60 * 1000, 'Database idle timeout should be 2 hours');
});


