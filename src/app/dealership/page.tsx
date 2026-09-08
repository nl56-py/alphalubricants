import Image from 'next/image';
import { DealershipForm } from '@/components/dealership/DealershipForm';
import { getSettings, getHomeMedia } from '@/lib/server/catalog';
import styles from '@/components/dealership/dealership.module.css';

export const metadata = {
  title: 'Join our dealership network | Alpha Lubricants Nepal',
  description: 'Enquire about an Alpha Lubricants retail dealership, wholesale distribution or workshop partnership in Nepal.'
};

export default async function DealershipPage() {
  const [settings, homeMedia] = await Promise.all([getSettings(), getHomeMedia()]);
  const bannerImage = homeMedia.dealershipBannerImage || '/images/dealearship banner.jpg';

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerBackdrop}>
          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.backdropImg}
          />
          <div className={styles.backdropOverlay} />
        </div>

        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <span className={styles.headerEyebrow}>GROW WITH ALPHA</span>
            <h1>Become an Alpha<br />dealership partner.</h1>
            <p>
              Bring Alpha lubricants to your community. Partner with Nepal’s dedicated performance lubricant brand for retail, wholesale or workshop distribution.
            </p>
            <div className={styles.headerHighlights}>
              <div className={styles.highlightItem}>
                <strong>Direct Brand Support</strong>
                <span>Technical advisory & local promotional collateral</span>
              </div>
              <div className={styles.highlightItem}>
                <strong>Competitive Margins</strong>
                <span>Healthy retail & wholesale margin structures</span>
              </div>
            </div>
          </div>

          <div className={styles.bannerVisual}>
            <div className={styles.bannerFrame}>
              <Image
                src={bannerImage}
                alt="Alpha Lubricants Dealership Banner"
                width={440}
                height={550}
                priority
                className={styles.bannerImg}
              />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <h2>Let’s build a partnership.</h2>
          <p>We welcome enquiries from retailers, distributors and workshops across Nepal.</p>
          <ul>
            <li>Share your business and contact details.</li>
            <li>Our team reviews your location and requirements.</li>
            <li>We discuss availability, terms and next steps with you.</li>
          </ul>
          <h3>Speak with our team</h3>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
          <p>{settings.address}</p>
          <small>Submitting an enquiry does not create a dealership agreement.</small>
        </aside>
        <DealershipForm />
      </div>
    </main>
  );
}
