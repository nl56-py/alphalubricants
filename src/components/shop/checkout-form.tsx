'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from './cart-provider';
import { formatPrice } from './types';

type Totals = { subtotalPaisa: number; discountPaisa: number; shippingPaisa: number; totalPaisa: number };
type Shipping = { name: string; phone: string; address: string; city: string; notes: string };
export function CheckoutForm({ user }: { user: { name: string; phone: string | null; email: string } }) {
  const { items, hydrated, subtotalPaisa, clearCart } = useCart();
  const [shipping, setShipping] = useState<Shipping>({ name: user.name, phone: user.phone || '', address: '', city: '', notes: '' });
  const [promoCode, setPromoCode] = useState('');
  const [quote, setQuote] = useState<{ totals: Totals; fingerprint: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<{ number: string; totalPaisa: number } | null>(null);
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const payload = { items: items.map(item => ({ productId: item.productId, quantity: item.quantity })), shipping, promoCode: promoCode.trim().toUpperCase() || undefined };
  const fingerprint = JSON.stringify(payload);
  const validQuote = quote?.fingerprint === fingerprint ? quote.totals : null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      let body = fingerprint;
      if (validQuote) {
        if (checkoutAttempt.current?.fingerprint !== fingerprint) {
          let saved: { fingerprint?: string; key?: string } | null = null;
          try { saved = JSON.parse(sessionStorage.getItem('alpha-checkout-attempt') || 'null'); } catch { /* In-memory retries remain available. */ }
          checkoutAttempt.current = { fingerprint, key: saved?.fingerprint === fingerprint && typeof saved.key === 'string' ? saved.key : crypto.randomUUID() };
          try { sessionStorage.setItem('alpha-checkout-attempt', JSON.stringify(checkoutAttempt.current)); } catch { /* Keep the attempt in memory when storage is unavailable. */ }
        }
        body = JSON.stringify({ ...payload, idempotencyKey: checkoutAttempt.current.key });
      }
      const response = await fetch(validQuote ? '/api/checkout' : '/api/checkout/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to complete checkout. Please try again.');
      if (validQuote) {
        if (!data.order?.number || !Number.isFinite(data.order.totalPaisa)) throw new Error('An order confirmation was not received. Check your account before trying again.');
        setOrder({ number: data.order.number, totalPaisa: data.order.totalPaisa });
        clearCart();
        try { sessionStorage.removeItem('alpha-checkout-attempt'); } catch { /* The order has already been confirmed. */ }
      } else {
        if (![data.subtotalPaisa, data.discountPaisa, data.shippingPaisa, data.totalPaisa].every(Number.isFinite)) throw new Error('Unable to confirm the order total. Please try again.');
        setQuote({ totals: data, fingerprint });
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Please check your connection and try again.'); }
    finally { setBusy(false); }
  }
  if (order) return <div className="shop-empty shop-order-success"><CheckCircle2 size={48}/><p className="shop-eyebrow">ORDER RECEIVED</p><h2>Thank you, {shipping.name.split(' ')[0]}.</h2><p>Your order <strong>{order.number}</strong> has been placed.</p><p>Pay <strong>{formatPrice(order.totalPaisa)}</strong> in cash on delivery. Follow your order status in your account.</p><Link href="/account" className="shop-button">View my orders <ArrowRight size={18}/></Link></div>;
  if (!hydrated) return <p className="shop-loading" role="status">Loading your cart…</p>;
  if (!items.length) return <div className="shop-empty"><h2>Your cart is empty.</h2><p>Add an Alpha product to get started.</p><Link className="shop-button" href="/products">Explore products <ArrowRight size={18}/></Link></div>;
  function field(key: keyof Shipping, label: string, autoComplete?: string, type = 'text') {
    return <label className={key === 'address' ? 'shop-field shop-field-wide' : 'shop-field'}>{label}<input type={type} required={key !== 'notes'} minLength={key === 'phone' ? 7 : key === 'address' ? 5 : 2} maxLength={key === 'address' ? 500 : key === 'phone' ? 30 : key === 'city' ? 100 : 120} autoComplete={autoComplete} value={shipping[key]} onChange={event => setShipping(previous => ({ ...previous, [key]: event.target.value }))}/></label>;
  }
  return <form onSubmit={submit} className="shop-checkout-layout"><fieldset className="shop-checkout-fields" disabled={busy}><div className="shop-checkout-section"><span className="shop-step">01</span><h2>Delivery details</h2><p className="shop-muted">Signed in as {user.email}</p><div className="shop-form-grid">{field('name', 'Full name', 'shipping name')}{field('phone', 'Phone number', 'shipping tel', 'tel')}{field('address', 'Street address, area and landmark', 'shipping street-address')}{field('city', 'City / municipality', 'shipping address-level2')}<label className="shop-field">Country<input value="Nepal" disabled/></label><label className="shop-field shop-field-wide">Delivery notes <span>(optional)</span><textarea rows={3} maxLength={1000} placeholder="Anything that helps us find you" value={shipping.notes} onChange={event => setShipping(previous => ({ ...previous, notes: event.target.value }))}/></label></div></div><div className="shop-checkout-section"><span className="shop-step">02</span><h2>Payment</h2><div className="shop-payment-option"><Truck size={24}/><div><strong>Cash on delivery</strong><p>Pay in Nepalese rupees when your order arrives.</p></div><span className="shop-radio-selected"/></div></div></fieldset><aside className="shop-order-summary"><p className="shop-eyebrow">YOUR ALPHA, ON THE WAY</p><h2>Your order</h2><div className="shop-checkout-items">{items.map(item => <div key={item.productId}><span>{item.name} <small>× {item.quantity}</small></span><strong>{formatPrice(item.pricePaisa * item.quantity)}</strong></div>)}</div><label className="shop-field shop-promo-label">Promo code <span>(optional)</span><input aria-label="Promo code" maxLength={40} disabled={busy} autoCapitalize="characters" placeholder="Enter your code" value={promoCode} onChange={event => setPromoCode(event.target.value.toUpperCase())}/></label><div className="shop-total-row"><span>Subtotal</span><strong>{formatPrice(validQuote?.subtotalPaisa ?? subtotalPaisa)}</strong></div><div className="shop-total-row"><span>Delivery</span><span>{validQuote ? validQuote.shippingPaisa ? formatPrice(validQuote.shippingPaisa) : 'Free' : 'Calculated on review'}</span></div>{validQuote && validQuote.discountPaisa > 0 && <div className="shop-total-row shop-discount"><span>Promo discount</span><strong>−{formatPrice(validQuote.discountPaisa)}</strong></div>}<div className="shop-total-row shop-grand-total"><span>Total</span><strong>{validQuote ? formatPrice(validQuote.totalPaisa) : 'Review to confirm'}</strong></div>{error && <p role="alert" className="shop-error">{error} <Link href="/account">View my orders</Link></p>}{validQuote && <p role="status" className="shop-quote-success"><ShieldCheck size={17}/> Total confirmed. Ready to place your order.</p>}<button className="shop-button shop-button-full" disabled={busy} type="submit">{busy ? 'Please wait…' : validQuote ? 'Place order · Cash on delivery' : 'Review order'}{!busy && <ArrowRight size={18}/>}</button><p className="shop-payment-note">{validQuote ? 'Your order is placed when you press the button above.' : 'Review delivery fees and your promo discount before placing your order.'}</p><Link href="/cart" className="shop-continue">Edit your cart</Link></aside></form>;
}
