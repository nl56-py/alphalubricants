import { DealershipForm } from '@/components/dealership/DealershipForm';
import { getSettings } from '@/lib/server/catalog';
import styles from '@/components/dealership/dealership.module.css';

export const metadata = { title: 'Join our dealership network | Alpha Lubricants Nepal', description: 'Enquire about an Alpha Lubricants retail dealership, wholesale distribution or workshop partnership in Nepal.' };

export default async function DealershipPage() {
  const settings = await getSettings();
  return <main id="main-content" className={styles.page}><header className={styles.header}><span>GROW WITH ALPHA</span><h1>Become an Alpha<br />dealership partner.</h1><p>Bring Alpha lubricants to your community. Tell us about your business and the area you would like to serve.</p></header><div className={styles.layout}><aside className={styles.aside}><h2>Let’s build a partnership.</h2><p>We welcome enquiries from retailers, distributors and workshops across Nepal.</p><ul><li>Share your business and contact details.</li><li>Our team reviews your location and requirements.</li><li>We discuss availability, terms and next steps with you.</li></ul><h3>Speak with our team</h3><a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a><a href={`mailto:${settings.email}`}>{settings.email}</a><p>{settings.address}</p><small>Submitting an enquiry does not create a dealership agreement.</small></aside><DealershipForm /></div></main>;
}
