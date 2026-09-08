'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, User, Tag } from 'lucide-react';
import type { FeaturedRider, HomeMediaSettings } from '@/lib/server/catalog';

export function HomeRiderCommunity({
  riders,
  media,
}: {
  riders: FeaturedRider[];
  media?: HomeMediaSettings;
}) {
  const hasRiders = riders && riders.length > 0;

  return (
    <section className="partnership-community-section" data-reveal>
      {/* Top Banner introducing the Rider Community */}
      <div className="partnership">
        <div className="partnership-image">
          <Image
            src={media?.partnershipImage || '/images/riders.jpg'}
            alt="Alpha Lubricants Riders - Meengma #53 and Ruby #07"
            fill
            sizes="(max-width:700px) 100vw, 50vw"
            priority={false}
          />
        </div>
        <div className="partnership-copy">
          <p className="eyebrow">POWER MEETS THE TRACK</p>
          <h2>
            Proud riders.<br />
            <span>Stronger together.</span>
          </h2>
          <h3>Meet the Alpha community</h3>
          <p>
            Power meets the track 🔥🏁 Meet Meengma #53 &amp; Ruby #07, proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️
          </p>
          <p>
            From dirt trails to high-RPM track circuits, Alpha Lubricants stands with riders who live for the journey and demand uncompromising engine protection.
          </p>
          <Link href="/community" className="outline-button">
            Explore rider stories <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>

      {/* Featured Riders Profiles Grid */}
      {hasRiders && (
        <div className="wrap rider-community-showcase" style={{ paddingTop: '60px', paddingBottom: '70px' }}>
          <div className="section-heading" style={{ marginBottom: '36px' }}>
            <div>
              <p className="eyebrow">OFFICIAL RIDERS</p>
              <h2>The Faces of Alpha Nepal</h2>
              <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                Power meets the track 🔥🏁 Meet Meengma #53 &amp; Ruby #07, proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️
              </p>
            </div>
            <Link href="/community" className="text-link">
              View all riders <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="home-riders-grid">
            {riders.map(rider => (
              <article key={rider.id} className="home-rider-card">
                <div className="home-rider-avatar-wrap">
                  {rider.image ? (
                    <Image
                      src={rider.image}
                      alt={rider.name}
                      fill
                      sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw"
                      className="home-rider-avatar-img"
                      unoptimized={rider.image.startsWith('https://')}
                    />
                  ) : (
                    <div className="home-rider-avatar-placeholder">
                      <User size={48} strokeWidth={1.5} />
                    </div>
                  )}
                  <span className="home-rider-badge">
                    <Sparkles size={13} /> Official Rider
                  </span>
                </div>

                <div className="home-rider-content">
                  <h3 className="home-rider-name">{rider.name}</h3>

                  {rider.promoCode && (
                    <div className="home-rider-promo-chip">
                      <Tag size={13} />
                      <span>Code: <strong>{rider.promoCode}</strong></span>
                    </div>
                  )}

                  <p className="home-rider-bio">
                    {rider.bio || 'Official Alpha Lubricants rider representing power and protection on Nepal roads.'}
                  </p>

                  <div className="home-rider-footer">
                    <Link href="/community" className="home-rider-link">
                      <span>Rider journey</span>
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            {/* Invite card to join */}
            <article className="home-rider-card home-rider-join-card">
              <div className="home-rider-join-inner">
                <span className="eyebrow light">BECOME AN ALPHA RIDER</span>
                <h3>Are you a passionate rider?</h3>
                <p>
                  Represent Alpha Lubricants on roads and tracks. Get sponsored support, rider kits, and an attributed promo code.
                </p>
                <Link href="/contact?interest=rider" className="button white-button">
                  Join the rider team <ArrowUpRight size={17} />
                </Link>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}
