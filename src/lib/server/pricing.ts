export type CartItemPricing = { productId: string; pricePaisa: number; quantity: number };
export type PromoInput = {
  active: boolean;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderPaisa: number;
  maxDiscountPaisa: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  productIds?: string[] | unknown;
};

export function calculateDiscount(
  subtotal: number,
  promo: PromoInput | null,
  itemsOrNow?: CartItemPricing[] | Date,
  maybeNow?: Date
) {
  const items = Array.isArray(itemsOrNow) ? itemsOrNow : undefined;
  const now = itemsOrNow instanceof Date ? itemsOrNow : (maybeNow ?? new Date());
  if (!promo) return 0;
  if (!promo.active || (promo.startsAt && promo.startsAt > now) || (promo.expiresAt && promo.expiresAt <= now)) {
    throw new Error('This promo code is not active.');
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new Error('This promo code has reached its usage limit.');
  }

  const rawProductIds = promo.productIds;
  const productIds = Array.isArray(rawProductIds) ? (rawProductIds as string[]).filter(Boolean) : [];

  let eligibleSubtotal = subtotal;

  if (productIds.length > 0) {
    if (!items || items.length === 0) {
      throw new Error('This promo code is only valid for specific products.');
    }
    const eligibleItems = items.filter(item => productIds.includes(item.productId));
    if (eligibleItems.length === 0) {
      throw new Error('This promo code is not applicable to the items in your cart.');
    }
    eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.pricePaisa * item.quantity, 0);
  }

  if (eligibleSubtotal < promo.minOrderPaisa) {
    throw new Error(
      productIds.length > 0
        ? 'Eligible products in your cart do not meet the minimum for this promo code.'
        : 'Your order does not meet the minimum for this promo code.'
    );
  }

  const amount = promo.type === 'PERCENT' ? Math.floor((eligibleSubtotal * promo.value) / 100) : promo.value;
  return Math.min(eligibleSubtotal, amount, promo.maxDiscountPaisa ?? eligibleSubtotal);
}

export function calculateShipping(subtotal: number, settings: { shippingPaisa: number; freeShippingAbovePaisa: number }) {
  return subtotal >= settings.freeShippingAbovePaisa ? 0 : settings.shippingPaisa;
}

