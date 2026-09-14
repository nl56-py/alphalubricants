"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { api, type SessionUser } from "../dashboard/session";

export function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const data = await api<{ user: SessionUser }>(`/api/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(values) });
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = data.user?.role?.toUpperCase() === "ADMIN" ? "/admin" : data.user?.role?.toUpperCase() === "RIDER" ? "/rider" : "/account";
      let target = destination;
      if (next && (next === '/' || /^\/[^\/\\]/.test(next))) {
        try {
          const parsed = new URL(next, window.location.origin);
          if (parsed.origin === window.location.origin) {
            target = parsed.pathname + parsed.search + parsed.hash;
          }
        } catch {
          // ignore
        }
      }
      window.location.href = target;
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <main className="alpha-auth"><div className="auth-story"><Link href="/" className="dash-brand" aria-label="Alpha Lubricants Home"><Image src="/images/logo.webp" alt="Alpha Lubricants" width={180} height={58} style={{ objectFit: "contain", height: "auto", maxWidth: "180px" }} priority /></Link><div><span className="dash-eyebrow">PERFORMANCE STARTS HERE</span><h1>A smoother journey.<br /><em>Every time.</em></h1><p>Find the right lubricant, keep track of your orders, and give your engine the care it deserves.</p></div><span className="auth-story-bottom">ENGINEERED FOR THE ROAD AHEAD <ArrowRight size={20} /></span></div><div className="auth-form-side"><div className="auth-form-inner"><Link href="/" className="dash-text-link">← Back to Alpha Lubricants</Link><div className="auth-lock"><LockKeyhole size={24} /></div><span className="dash-eyebrow">YOUR ALPHA ACCOUNT</span><h2>{register ? "Let’s get you moving." : "Welcome back."}</h2><p>{register ? "Create an account for a better journey with Alpha." : "Sign in to manage your orders and your account."}</p><form onSubmit={submit}>
      {register && <label className="dash-field">Full name<input name="name" autoComplete="name" placeholder="Your full name" required minLength={2} maxLength={100} /></label>}
      <label className="dash-field">Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
      {register && <label className="dash-field">Phone number<input type="tel" name="phone" autoComplete="tel" placeholder="98XXXXXXXX" required /></label>}
      <label className="dash-field">Password<span className="auth-password"><input type={visible ? "text" : "password"} name="password" autoComplete={register ? "new-password" : "current-password"} placeholder={register ? "At least 10 characters" : "Enter your password"} minLength={register ? 10 : undefined} maxLength={72} required /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
      {register && <label className="auth-terms"><input type="checkbox" required /> <span>I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
      {error && <div className="dash-error" role="alert">{error}</div>}
      <button type="submit" disabled={busy} className="dash-button auth-submit">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}<ArrowRight size={18} /></button>
    </form><p className="auth-switch">{register ? "Already have an account?" : "New to Alpha?"} <Link href={register ? "/account/login" : "/account/register"}>{register ? "Sign in" : "Create an account"}</Link></p><div className="auth-security"><ShieldCheck size={16} /> Your account is protected with secure authentication.</div></div></div></main>;
}
