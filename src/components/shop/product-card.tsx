'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './cart-provider';
import { formatPrice, type ShopProduct } from './types';

export function ProductCard({ product }: { product: ShopProduct }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  return <article className="shop-product-card">
    <Link href={`/products/${product.slug}`} className="shop-product-visual" aria-label={`View ${product.name}`}>
      <span className="shop-product-label">{product.viscosity}</span>
      <Image src={product.image} alt={`${product.name} ${product.size} bottle`} width={380} height={420} sizes="(max-width: 600px) 85vw, (max-width: 1000px) 45vw, 30vw" />
      <span className="shop-product-arrow"><ArrowUpRight size={20} /></span>
    </Link>
    <div className="shop-product-info"><p className="shop-eyebrow">{product.category} · {product.size}</p><h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2><p className="shop-product-description">{product.description}</p><div className="shop-product-bottom"><strong>{formatPrice(product.pricePaisa)}</strong><button className="shop-add-button" disabled={product.stock < 1} onClick={() => { addItem(product); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }} aria-label={`Add ${product.name} to cart`}><Plus size={17}/>{product.stock < 1 ? 'Out of stock' : added ? 'Added' : 'Add to cart'}</button></div><button className="shop-buy-button" disabled={product.stock < 1} onClick={() => { addItem(product); router.push('/checkout'); }}>{product.stock < 1 ? 'Out of stock' : 'Buy now'} <ArrowUpRight size={18}/></button></div>
    <span role="status" className="shop-sr-only">{added ? `${product.name} added to cart` : ''}</span>
  </article>;
}
