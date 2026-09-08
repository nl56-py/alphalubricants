import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {getSettings} from '@/lib/server/catalog';
import {PageBanner} from '@/components/page-banner';
import {RiderProfiles} from '@/components/cms-sections';

export const metadata:Metadata={
  title:'Alpha Rider Community Nepal',
  description:'Connect with the Alpha Lubricants riding community in Nepal. Power meets the track with official riders Meengma #53 & Ruby #07.',
  alternates:{canonical:'/community'}
};

export default async function Community(){
  const settings=await getSettings();
  return (
    <main id="main-content">
      <PageBanner
        title="The road brings us together."
        eyebrow="THE ALPHA RIDER COMMUNITY"
        description="Power meets the track 🔥🏁 Meet Meengma #53 & Ruby #07, proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️"
      />
      <section className="partnership">
        <div className="partnership-image">
          <Image
            src="/images/riders.jpg"
            alt="Alpha Lubricants Riders - Meengma #53 and Ruby #07"
            fill
            sizes="(max-width:700px) 100vw, 50vw"
          />
        </div>
        <div className="partnership-copy">
          <p className="eyebrow">RIDE. CONNECT. INSPIRE.</p>
          <h2>One passion.<br/><span>Many journeys.</span></h2>
          <p>
            Power meets the track 🔥🏁 Meet Meengma #53 &amp; Ruby #07, proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️
          </p>
          <p>
            Follow Alpha Lubricants Nepal for rider stories, race updates and moments from our community. Share your journey and stay connected with what&apos;s next.
          </p>
          <a href={settings.facebook} target="_blank" rel="noreferrer" className="outline-button">
            Join us on Facebook <ArrowUpRight size={17}/>
          </a>
          <h3 style={{marginTop:40}}>Become an Alpha rider</h3>
          <p>
            Interested in representing Alpha? Contact our team to discuss joining our riders. Approved riders receive a rider account to follow sales attributed to their promo codes.
          </p>
          <Link href="/contact?interest=rider" className="text-link">
            Let&apos;s talk <ArrowUpRight size={17}/>
          </Link>
          <Link href="/rider" className="text-link" style={{marginTop:20}}>
            Already an Alpha rider? Rider portal <ArrowUpRight size={17}/>
          </Link>
        </div>
      </section>
      <RiderProfiles/>
    </main>
  );
}
