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
      const response = await fetch('/api/dealership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your enquiry. Please try again.');
      setSuccess(result.message); form.reset();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <section className={styles.formPanel}>
      <h2>Dealership enquiry</h2>
      <p>Fill out the details below to join our dealership network. Fields marked * are required.</p>
      {success ? (
        <div role="status" className={styles.success}>
          <h3>Thank you for your interest.</h3>
          <p>{success}</p>
          <button onClick={() => setSuccess('')}>Send another enquiry</button>
        </div>
      ) : (
        <form onSubmit={submit} className={styles.form}>
          <label>
            Full name *
            <input name="name" autoComplete="name" required minLength={2} maxLength={120} placeholder="Your full name" />
          </label>
          <label>
            Phone number *
            <input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} placeholder="e.g. 98XXXXXXXX" />
          </label>
          <label>
            Business name *
            <input name="businessName" autoComplete="organization" required minLength={2} maxLength={180} placeholder="Registered business name" />
          </label>
          <label>
            Business phone number
            <input name="businessPhone" type="tel" maxLength={30} placeholder="Optional landline or second number" />
          </label>
          <label className={styles.wide}>
            Business address *
            <input name="address" autoComplete="street-address" required minLength={3} maxLength={300} placeholder="Street, area, city or district" />
          </label>
          {error && <p role="alert" className={styles.wide}>{error}</p>}
          <button className={styles.submit} disabled={busy} type="submit">
            {busy ? 'Sending enquiry…' : 'Submit dealership enquiry →'}
          </button>
        </form>
      )}
    </section>
  );
}
