import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckoutForm } from '@/components/shop/checkout-form';
import { currentUser } from '@/lib/server/auth';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const user = await currentUser();
  return (
    <main id="main-content" className="shop-page shop-container shop-checkout-page">
      <nav className="shop-breadcrumb" aria-label="Breadcrumb">
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <span>Checkout</span>
      </nav>
      <p className="shop-eyebrow">ONE STEP CLOSER TO THE ROAD</p>
      <h1>Make it yours.</h1>
      <CheckoutForm user={user ? { name: user.name, phone: user.phone, email: user.email } : null} />
    </main>
  );
}

