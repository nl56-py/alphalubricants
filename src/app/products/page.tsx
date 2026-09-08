import type { Metadata } from 'next';
import Link from 'next/link';
import { Catalog } from '@/components/shop/catalog';
import { toShopProduct } from '@/components/shop/types';
import { getProducts } from '@/lib/server/catalog';

export const metadata: Metadata = {
  title: 'Engine Oils & Lubricants in Nepal',
  description: 'Explore Alpha motorcycle engine oils and lubricants in Nepal. Compare formulations, pack sizes and specifications to find the right oil for your engine.',
  alternates: { canonical: '/products' },
};
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const products = (await getProducts()).map(toShopProduct);
  const query = await searchParams;
  const initialQuery = typeof query.q === 'string' ? query.q.slice(0, 150) : '';
  const categoryValue = typeof query.category === 'string' ? query.category.slice(0, 100) : '';
  const initialCategory = products.find(product => product.category.toLowerCase() === categoryValue.toLowerCase())?.category || categoryValue || 'All products';
  return <main id="main-content" className="shop-page"><section className="shop-page-heading"><div className="shop-container"><nav className="shop-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Our products</span></nav><p className="shop-eyebrow">PRECISION IN EVERY DROP</p><h1>Power your <em>possibilities.</em></h1><p>Explore engine oils made to keep your world moving. Find the right Alpha for your journey.</p></div></section><section className="shop-container shop-catalog-section" aria-label="Product catalogue"><Catalog key={`${initialQuery}:${initialCategory}`} products={products} initialQuery={initialQuery} initialCategory={initialCategory}/></section></main>;
}
