'use client';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './cart-provider';
import type { ShopProduct } from './types';

export function ProductPurchase({ product }: { product: ShopProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  return <div className="shop-purchase"><p className={`shop-stock ${product.stock > 0 ? 'is-available' : ''}`}>{product.stock > 0 ? 'Available to order' : 'Currently out of stock'}</p><div className="shop-purchase-actions"><div className="shop-quantity"><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16}/></button><input type="number" aria-label="Quantity" min={1} max={Math.min(product.stock || 1, 50)} value={quantity} onChange={event => setQuantity(Math.min(Math.max(1, Math.floor(Number(event.target.value)) || 1), product.stock || 1, 50))}/><button aria-label="Increase quantity" disabled={quantity >= product.stock || quantity >= 50} onClick={() => setQuantity(q => q + 1)}><Plus size={16}/></button></div><button className="shop-button" disabled={product.stock < 1} onClick={() => { addItem(product, quantity); setAdded(true); }}>{added ? <Check size={18}/> : <ShoppingBag size={18}/>}{added ? 'Added to your cart' : 'Add to cart'}</button></div>{added && <p role="status" className="shop-added">Ready when you are. <Link href="/cart">View your cart →</Link></p>}<p className="shop-purchase-note">Prices in Nepalese rupees. Delivery is calculated at checkout.</p></div>;
}
