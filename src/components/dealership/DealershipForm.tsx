'use client';
import { useState, type FormEvent } from 'react';
import { dealershipTypes } from '@/lib/dealership';
import styles from './dealership.module.css';

export function DealershipForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/dealership', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, consent: values.consent === 'on' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your enquiry. Please try again.');
      setSuccess(result.message); form.reset();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className={styles.formPanel}><h2>Dealership enquiry</h2><p>No account needed. Fields marked * are required.</p>{success ? <div role="status" className={styles.success}><h3>Thank you for your interest.</h3><p>{success}</p><button onClick={() => setSuccess('')}>Send another enquiry</button></div> : <form onSubmit={submit} className={styles.form}><label>Full name *<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label><label>Phone number *<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} /></label><label>Email address *<input name="email" type="email" autoComplete="email" required maxLength={191} /></label><label>Business name *<input name="businessName" autoComplete="organization" required minLength={2} maxLength={180} /></label><label className={styles.wide}>Business address *<input name="address" autoComplete="street-address" required minLength={3} maxLength={300} /></label><label>District *<input name="district" required minLength={2} maxLength={100} placeholder="e.g. Kathmandu" /></label><label>Interested in *<select name="dealershipType" required defaultValue=""><option value="" disabled>Select a partnership</option>{dealershipTypes.map(type => <option key={type}>{type}</option>)}</select></label><label className={styles.wide}>Business experience *<select name="experience" required defaultValue=""><option value="" disabled>Select your experience</option>{['Starting a new business', 'Less than 2 years', '2–5 years', 'More than 5 years'].map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.wide}>Tell us about your plans<textarea name="message" maxLength={3000} rows={5} placeholder="Current product range, proposed service area or anything you would like us to know." /></label><label className={`${styles.wide} ${styles.consent}`}><input name="consent" type="checkbox" required /><span>I agree that Alpha Lubricants may use these details to respond to my dealership enquiry. *</span></label>{error && <p role="alert" className={styles.wide}>{error}</p>}<button className={styles.submit} disabled={busy} type="submit">{busy ? 'Sending enquiry…' : 'Submit dealership enquiry →'}</button></form>}</section>;
}
