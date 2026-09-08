export type ShopProduct = {
  id: string; slug: string; name: string; description: string; category: string;
  viscosity: string; size: string; pricePaisa: number; stock: number; image: string;
  featured: boolean; active: boolean; specs: Record<string, unknown>;
};

export const formatPrice = (paisa: number) => new Intl.NumberFormat('en-NP', {
  style: 'currency', currency: 'NPR', minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(paisa / 100);

export function toShopProduct(product: Omit<ShopProduct, 'specs'> & { specs: unknown }): ShopProduct {
  return { ...product, specs: product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs) ? product.specs as Record<string, unknown> : {} };
}
