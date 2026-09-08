import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { getProductBySlug, getProducts } from '@/lib/server/catalog';
import { ProductPurchase } from '@/components/shop/product-purchase';
import { ProductCard } from '@/components/shop/product-card';
import { formatPrice, toShopProduct } from '@/components/shop/types';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  return { title: `${product.name} ${product.size} | Engine Oil in Nepal`, description: product.description, alternates: { canonical: `/products/${product.slug}` }, openGraph: { title: `${product.name} ${product.size}`, description: product.description, images: [{ url: product.image, alt: product.name }] } };
}
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const record = await getProductBySlug(slug);
  if (!record) notFound();
  const product = toShopProduct(record);
  const related = (await getProducts()).filter(item => item.id !== product.id).slice(0, 3).map(toShopProduct);
  const baseUrl = process.env.APP_URL || 'https://alphalubricant.com';
  const schema = { '@context': 'https://schema.org', '@type': 'Product', name: `${product.name} ${product.size}`, description: product.description, image: new URL(product.image, baseUrl).href, sku: product.id, brand: { '@type': 'Brand', name: 'Alpha Lubricants' }, category: product.category, offers: { '@type': 'Offer', url: `${baseUrl}/products/${product.slug}`, priceCurrency: 'NPR', price: product.pricePaisa / 100, availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: 'Alpha Lubricants' } } };
  return <main id="main-content" className="shop-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/><div className="shop-container"><nav className="shop-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/products">Products</Link><span>/</span><span>{product.name}</span></nav><div className="shop-detail"><div className="shop-detail-visual"><span className="shop-detail-badge">{product.viscosity}</span><Image src={product.image} alt={`${product.name} ${product.size} packaging`} width={650} height={700} priority sizes="(max-width: 800px) 90vw, 50vw"/></div><div className="shop-detail-copy"><Link href="/products" className="shop-back"><ArrowLeft size={15}/> All products</Link><p className="shop-eyebrow">{product.category} · {product.size}</p><h1>{product.name}</h1><p className="shop-detail-description">{product.description}</p><p className="shop-detail-price">{formatPrice(product.pricePaisa)}</p><ProductPurchase product={product}/><div className="shop-detail-assurances"><span><ShieldCheck size={20}/> Shop directly with Alpha</span><span><Truck size={20}/> Cash on delivery</span></div><details className="shop-specs" open><summary>Product specifications</summary><dl><div><dt>Category</dt><dd>{product.category}</dd></div><div><dt>Pack size</dt><dd>{product.size}</dd></div>{product.viscosity && <div><dt>Grade / formulation</dt><dd>{product.viscosity}</dd></div>}{Object.entries(product.specs).filter(([, value]) => typeof value === 'string' || typeof value === 'number').map(([key, value]) => <div key={key}><dt>{key.replace(/[_-]/g, ' ')}</dt><dd>{String(value)}</dd></div>)}</dl></details><details className="shop-specs"><summary>Choosing your oil</summary><p>Follow the viscosity, oil specification and service interval in your vehicle manufacturer&apos;s handbook. Contact the Alpha team for help confirming product compatibility.</p></details></div></div>{related.length > 0 && <section className="shop-related"><p className="shop-eyebrow">EXPLORE THE RANGE</p><h2>More power to your journey.</h2><div className="shop-product-grid">{related.map(item => <ProductCard key={item.id} product={item}/>)}</div></section>}</div></main>;
}
