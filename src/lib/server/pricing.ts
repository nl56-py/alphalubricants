export type PromoInput = { active: boolean; type: 'PERCENT' | 'FIXED'; value: number; minOrderPaisa: number; maxDiscountPaisa: number | null; maxUses: number | null; usedCount: number; startsAt: Date | null; expiresAt: Date | null };
export function calculateDiscount(subtotal: number, promo: PromoInput | null, now = new Date()) {
  if (!promo) return 0;
  if (!promo.active || (promo.startsAt && promo.startsAt > now) || (promo.expiresAt && promo.expiresAt <= now)) throw new Error('This promo code is not active.');
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new Error('This promo code has reached its usage limit.');
  if (subtotal < promo.minOrderPaisa) throw new Error('Your order does not meet the minimum for this promo code.');
  const amount = promo.type === 'PERCENT' ? Math.floor(subtotal * promo.value / 100) : promo.value;
  return Math.min(subtotal, amount, promo.maxDiscountPaisa ?? subtotal);
}
export function calculateShipping(subtotal: number, settings: { shippingPaisa: number; freeShippingAbovePaisa: number }) {
  return subtotal >= settings.freeShippingAbovePaisa ? 0 : settings.shippingPaisa;
}
