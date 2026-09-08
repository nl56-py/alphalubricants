'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ShopProduct } from './types';

export type CartItem = Pick<ShopProduct, 'slug' | 'name' | 'image' | 'pricePaisa' | 'stock'> & { productId: string; quantity: number };
type CartContextValue = {
  items: CartItem[]; hydrated: boolean; itemCount: number; subtotalPaisa: number;
  addItem: (product: ShopProduct, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void; clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'alpha-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (Array.isArray(saved)) {
        const valid = saved.filter((item): item is CartItem => item && typeof item.productId === 'string' && typeof item.slug === 'string' && typeof item.name === 'string' && typeof item.image === 'string' && Number.isSafeInteger(item.pricePaisa) && item.pricePaisa > 0 && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isInteger(item.stock) && item.stock >= item.quantity);
        setItems([...new Map(valid.map(item => [item.productId, { ...item, quantity: Math.min(item.quantity, 50) }])).values()].slice(0, 50));
      }
    } catch { /* A malformed or unavailable local store starts an empty cart. */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* The cart still works in memory. */ } } }, [items, hydrated]);
  const addItem = (product: ShopProduct, quantity = 1) => {
    if (product.stock < 1 || !Number.isInteger(quantity) || quantity < 1) return;
    setItems(previous => {
      const existing = previous.find(item => item.productId === product.id);
      const count = Math.min(product.stock, 50, (existing?.quantity || 0) + quantity);
      const item = { productId: product.id, slug: product.slug, name: product.name, image: product.image, pricePaisa: product.pricePaisa, stock: product.stock, quantity: count };
      return existing ? previous.map(current => current.productId === product.id ? item : current) : [...previous, item];
    });
  };
  const setQuantity = (productId: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    setItems(previous => quantity <= 0 ? previous.filter(item => item.productId !== productId) : previous.map(item => item.productId === productId ? { ...item, quantity: Math.min(quantity, item.stock, 50) } : item));
  };
  return <CartContext.Provider value={{ items, hydrated, addItem, setQuantity, removeItem: id => setItems(previous => previous.filter(item => item.productId !== id)), clearCart: () => setItems([]), itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotalPaisa: items.reduce((sum, item) => sum + item.quantity * item.pricePaisa, 0) }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be rendered inside CartProvider');
  return context;
}
