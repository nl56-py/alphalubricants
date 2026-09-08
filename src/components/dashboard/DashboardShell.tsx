"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, BarChart3, Bike, Boxes, ChevronRight, ExternalLink, Image, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, ShoppingBag, Tag, X } from "lucide-react";
import { api, useSession } from "./session";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/content", label: "Website content", icon: Image },
  { href: "/admin/promos", label: "Promotions", icon: Tag },
  { href: "/admin/riders", label: "Rider team", icon: Bike },
  { href: "/admin/oil-finder", label: "Vehicle oil finder", icon: Boxes },
  { href: "/admin/dealership", label: "Dealership enquiries", icon: ShoppingBag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children, role = "ADMIN" }: { children: ReactNode; role?: "ADMIN" | "RIDER" }) {
  const pathname = usePathname();
  const { user, loading, error } = useSession();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  if (loading) return <main className="dash-access"><div className="dash-spinner" /><p>Opening your workspace…</p></main>;
  if (!user) return <main className="dash-access"><ShieldCheck size={42} /><span className="dash-eyebrow">ALPHA WORKSPACE</span><h1>Your business, in focus.</h1><p>Sign in with your {role === "ADMIN" ? "administrator" : "rider"} account to continue.</p>{error && <p className="dash-error" role="alert">{error}</p>}<Link className="dash-button" href={`/account/login?next=${encodeURIComponent(pathname)}`}>Sign in securely <ArrowUpRight size={17} /></Link><Link className="dash-text-link" href="/">Back to the website</Link></main>;
  if (user.role.toUpperCase() !== role && !(role === "RIDER" && user.role.toUpperCase() === "ADMIN")) return <main className="dash-access"><ShieldCheck size={42} /><h1>This workspace is restricted.</h1><p>Your account does not have access to this area.</p><Link href="/account" className="dash-button">Go to my account</Link></main>;
  const links = role === "ADMIN" ? adminLinks : [{ href: "/rider", label: "My performance", icon: BarChart3 }, { href: "/rider/orders", label: "Assigned orders", icon: ShoppingBag }];
  async function logout() { try { await api("/api/auth/logout", { method: "POST" }); window.location.href = "/account/login"; } catch (e) { setLogoutError((e as Error).message); } }
  return <div className="dash-layout">
    {open && <button aria-label="Close navigation" className="dash-overlay" onClick={() => setOpen(false)} />}
    <aside className={`dash-sidebar ${open ? "is-open" : ""}`}>
      <Link href="/" className="dash-brand"><span className="dash-brand-mark">α</span><span>ALPHA<small>LUBRICANTS</small></span></Link>
      <div className="dash-workspace-label">{role === "ADMIN" ? "BUSINESS WORKSPACE" : "RIDER WORKSPACE"}</div>
      <nav aria-label="Dashboard navigation">{links.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`dash-nav-link ${pathname === item.href ? "active" : ""}`}><item.icon size={19} /><span>{item.label}</span>{pathname === item.href && <ChevronRight size={14} />}</Link>)}</nav>
      <div className="dash-sidebar-bottom"><div className="dash-help"><span className="dash-online-dot" /> Your connected workspace<p>Everything you need to keep moving forward.</p><Link href="/">View storefront <ExternalLink size={14} /></Link></div><div className="dash-profile"><span className="dash-avatar">{user.name?.slice(0, 1).toUpperCase() || "A"}</span><span><strong>{user.name}</strong><small>{role === "ADMIN" ? "Administrator" : "Rider partner"}</small></span><button aria-label="Sign out" onClick={logout}><LogOut size={18} /></button></div>{logoutError && <p role="alert" className="dash-error">{logoutError}</p>}</div>
    </aside>
    <div className="dash-main"><header className="dash-topbar"><div><button className="dash-mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><span>Workspace</span><ChevronRight size={14} /><strong>{links.find(item => item.href === pathname)?.label || "Overview"}</strong></div><Link href="/">Visit website <ArrowUpRight size={16} /></Link></header><main className="dash-content">{children}</main><footer className="dash-footer"><span>Alpha Lubricants · Business workspace</span><span>Made to keep you moving.</span></footer></div>
  </div>;
}
