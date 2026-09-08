import type { Metadata } from 'next';
import { CartPage } from '@/components/shop/cart-page';
export const metadata: Metadata = { title: 'Your Cart', robots: { index: false, follow: false } };
export default function Page() { return <CartPage/>; }
