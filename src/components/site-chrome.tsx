"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Globe,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
  Facebook,
  Instagram,
  Youtube,
  ArrowUp,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/components/shop/cart-provider";
type Settings = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  phone?: string;
  email?: string;
  address?: string;
};
const nav = [
  ["Products", "/products"],
  ["Find my oil", "/oil-finder"],
  ["Riders", "/community"],
  ["Gallery", "/gallery"],
  ["Videos", "/videos"],
  ["Blogs", "/blog"],
  ["Contact", "/contact"],
  ["Join dealership", "/dealership"],
];
export function SiteChrome({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: Settings;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const { itemCount } = useCart();
  useEffect(() => {
    setOpen(false);
    setSearch(false);
  }, [path]);
  if (path.startsWith("/admin") || path.startsWith("/rider"))
    return <>{children}</>;
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="utility">
          <div className="utility-tagline" aria-label="Performance. Protection. Power.">
            <span>Performance.</span>
            <span>Protection.</span>
            <span>Power.</span>
          </div>
          <div>
            <Link href="/rider">
              Rider portal <ArrowUpRight size={12} />
            </Link>
            <Link href="/account">My Account</Link>
          </div>
        </div>
        <div className="nav-row">
          <Link href="/" className="brand" aria-label="Alpha Lubricants home">
            <Image
              src="/images/logo.webp"
              alt="Alpha Lubricants"
              width={212}
              height={70}
              priority
            />
          </Link>
          <nav
            className={open ? "main-nav is-open" : "main-nav"}
            aria-label="Main navigation"
          >
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`${path.startsWith(href) ? "active" : ""} ${href === "/dealership" ? "dealership-nav" : ""}`}
              >
                {label}
                {label === "Products" && <ChevronDown size={13} />}
              </Link>
            ))}
            <div className="mobile-nav-utility">
              <Link
                href="/rider"
                className={path.startsWith("/rider") ? "active" : ""}
              >
                Rider portal <ArrowUpRight size={14} />
              </Link>
              <Link
                href="/account"
                className={path.startsWith("/account") ? "active" : ""}
              >
                My Account
              </Link>
            </div>
          </nav>
          <div className="nav-actions">
            <button
              aria-label="Search products"
              className="icon-button search-button"
              onClick={() => setSearch(!search)}
            >
              {search ? <X size={22} /> : <Search size={22} />}
            </button>
            <Link
              href="/account"
              aria-label="My account"
              className="icon-button"
            >
              <UserRound size={21} />
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${itemCount} items`}
              className="icon-button bag"
            >
              <ShoppingBag size={21} />
              {itemCount > 0 && <span>{itemCount}</span>}
            </Link>
            <span className="country">
              <Globe size={18} /> Nepal
            </span>
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="icon-button mobile-toggle"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {search && (
          <form className="header-search" action="/products">
            <Search size={20} />
            <input
              autoFocus
              aria-label="Search Alpha products"
              name="q"
              placeholder="Search engine oils, sizes and specifications…"
            />
            <button type="submit" className="button">
              Search
            </button>
          </form>
        )}
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-grid wrap">
          <div className="footer-brand">
            <Link href="/">
              <Image
                src="/images/logo.webp"
                alt="Alpha Lubricants"
                width={230}
                height={78}
              />
            </Link>
            <p>
              Performance for every journey.
              <br />
              Protection for what drives you.
            </p>
            <div className="social-links">
              {(
                [
                  [settings.facebook, Facebook, "Facebook"],
                  [settings.instagram, Instagram, "Instagram"],
                  [settings.youtube, Youtube, "YouTube"],
                ] as [string | undefined, LucideIcon, string][]
              ).map(([href, Icon, label]) =>
                href && typeof href === "string" && typeof Icon !== "string" ? (
                  <a
                    key={String(label)}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={String(label)}
                  >
                    <Icon size={21} />
                  </a>
                ) : null,
              )}
            </div>
          </div>
          <div>
            <h3>Our products</h3>
            <Link href="/products?category=Motorcycle">
              Motorcycle engine oils
            </Link>
            <Link href="/products">Explore the range</Link>
            <Link href="/oil-finder">Find the right oil</Link>
          </div>
          <div>
            <h3>The world of Alpha</h3>
            <Link href="/about">About us</Link>
            <Link href="/community">Rider community</Link>
            <Link href="/gallery">Gallery & videos</Link>
            <Link href="/blog">Latest insights</Link>
          </div>
          <div>
            <h3>Here to help</h3>
            <Link href="/contact">Contact us</Link>
            <a href={`tel:${settings.phone || "+9779801226178"}`}>
              {settings.phone || "+977 9801226178"}
            </a>
            <a href={`mailto:${settings.email || "info@alphalubricant.com"}`}>
              {settings.email || "info@alphalubricant.com"}
            </a>
            <p>
              {settings.address && settings.address !== "Nepal"
                ? settings.address
                : "Tinkune, Kathmandu, Nepal"}
            </p>
          </div>
        </div>
        <div className="footer-bottom wrap">
          <span>
            © {new Date().getFullYear()} Alpha Lubricants. All rights reserved.
          </span>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms & conditions</Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
