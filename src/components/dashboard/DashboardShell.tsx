"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, BarChart3, Bike, Boxes, ChevronRight, ExternalLink, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, ShoppingBag, Tag, X } from "lucide-react";
import { api, useSession } from "./session";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/content", label: "Website content", icon: ImageIcon },
  { href: "/admin/home-media", label: "Home media", icon: ImageIcon },
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

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      window.location.href = role === "RIDER" ? "/account/login?next=/rider" : "/account/login";
    } catch (e) {
      setLogoutError((e as Error).message);
    }
  }

  if (loading) return <main className="dash-access"><div className="dash-spinner" /><p>Opening your workspace…</p></main>;
  if (!user) {
    return (
      <main className="dash-access">
        <ShieldCheck size={42} />
        <span className="dash-eyebrow">{role === "ADMIN" ? "ALPHA WORKSPACE" : "ALPHA RIDER WORKSPACE"}</span>
        <h1>{role === "ADMIN" ? "Your business, in focus." : "Official Rider Workspace."}</h1>
        <p>
          {role === "ADMIN"
            ? "Sign in with your administrator account to manage store operations, orders, and dealership enquiries."
            : "Sign in with your official Alpha Rider account to track performance, deliveries, and promo referrals."}
        </p>
        {error && <p className="dash-error" role="alert">{error}</p>}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link className="dash-button" href={`/account/login?next=${encodeURIComponent(pathname)}`}>
            Sign in securely <ArrowUpRight size={17} />
          </Link>
          {role === "RIDER" && (
            <Link className="dash-button secondary" href="/community">
              View Rider Community
            </Link>
          )}
        </div>
        <Link className="dash-text-link" href="/" style={{ marginTop: "8px" }}>
          Back to storefront
        </Link>
      </main>
    );
  }

  // Strict role enforcement: Admins are NOT auto-authenticated into the Rider portal, and Riders cannot access the Admin panel
  if (user.role.toUpperCase() !== role) {
    const isRiderArea = role === "RIDER";
    const isAdminUser = user.role.toUpperCase() === "ADMIN";
    return (
      <main className="dash-access">
        <ShieldCheck size={42} />
        <span className="dash-eyebrow">RESTRICTED ACCESS</span>
        <h1>{isRiderArea ? "Rider Workspace Access" : "Administrator Workspace"}</h1>
        <p>
          {isRiderArea
            ? isAdminUser
              ? `You are currently signed in with an Administrator account (${user.email}). The Rider Workspace is reserved exclusively for official Alpha Lubricants riders.`
              : "This workspace is reserved for official Alpha Lubricants riders. You are currently signed in as a customer."
            : "Your account does not have administrator privileges."}
        </p>
        {logoutError && <p className="dash-error" role="alert">{logoutError}</p>}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          {isRiderArea && isAdminUser ? (
            <>
              <Link href="/admin" className="dash-button">
                Open Admin Workspace <ArrowUpRight size={17} />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="dash-button secondary"
              >
                <LogOut size={16} /> Sign in as Rider
              </button>
            </>
          ) : isRiderArea ? (
            <>
              <button
                type="button"
                onClick={logout}
                className="dash-button"
              >
                <LogOut size={16} /> Sign in as Rider
              </button>
              <Link href="/community" className="dash-button secondary">
                Meet our Riders
              </Link>
            </>
          ) : (
            <Link href="/account" className="dash-button">
              Go to my account
            </Link>
          )}
        </div>
        <Link className="dash-text-link" href="/" style={{ marginTop: "8px" }}>
          Back to storefront
        </Link>
      </main>
    );
  }

  const links = role === "ADMIN" ? adminLinks : [{ href: "/rider", label: "My performance", icon: BarChart3 }, { href: "/rider/orders", label: "Assigned orders", icon: ShoppingBag }];

  return (
    <div className="dash-layout">
      {open && <button aria-label="Close navigation" className="dash-overlay" onClick={() => setOpen(false)} />}
      <aside className={`dash-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/" className="dash-brand" aria-label="Alpha Lubricants Home">
          <NextImage
            src="/images/logo.webp"
            alt="Alpha Lubricants"
            width={160}
            height={52}
            style={{ objectFit: "contain", height: "auto", maxWidth: "160px" }}
            priority
          />
        </Link>
        <div className="dash-workspace-label">{role === "ADMIN" ? "BUSINESS WORKSPACE" : "RIDER WORKSPACE"}</div>
        <nav aria-label="Dashboard navigation">
          {links.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`dash-nav-link ${pathname === item.href ? "active" : ""}`}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {pathname === item.href && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>
        <div className="dash-sidebar-bottom">
          <div className="dash-help">
            <span className="dash-online-dot" /> Your connected workspace
            <p>Everything you need to keep moving forward.</p>
            <Link href="/">View storefront <ExternalLink size={14} /></Link>
          </div>
          <div className="dash-profile">
            <span className="dash-avatar">{user.name?.slice(0, 1).toUpperCase() || "A"}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{role === "ADMIN" ? "Administrator" : "Alpha Rider"}</small>
            </span>
            <button aria-label="Sign out" onClick={logout}><LogOut size={18} /></button>
          </div>
          {logoutError && <p role="alert" className="dash-error">{logoutError}</p>}
        </div>
      </aside>
      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <button className="dash-mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
              {open ? <X /> : <Menu />}
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{links.find(item => item.href === pathname)?.label || "Overview"}</strong>
          </div>
          <Link href="/">Visit website <ArrowUpRight size={16} /></Link>
        </header>
        <main className="dash-content">{children}</main>
        <footer className="dash-footer">
          <span>Alpha Lubricants · Business workspace</span>
          <span>Made to keep you moving.</span>
        </footer>
      </div>
    </div>
  );
}

