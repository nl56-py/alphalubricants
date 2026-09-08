import type {Metadata} from 'next';
import Link from 'next/link';
import {getContent} from '@/lib/server/catalog';
import {PageBanner} from '@/components/page-banner';
import {OfferCards} from '@/components/cms-sections';
export const revalidate=120;
export const metadata:Metadata={title:'Alpha Lubricants Offers Nepal',description:'Discover the latest announced Alpha Lubricants offers and product promotions in Nepal.',alternates:{canonical:'/offers'}};
export default async function OffersPage(){const items=await getContent('OFFER');return <main id="main-content"><PageBanner title="More for your next journey." eyebrow="ALPHA OFFERS" description="Discover current promotions and read the details of each offer before shopping."/><section className="wrap content-section">{items.length?<OfferCards items={items}/>:<div className="empty-content"><h2>New offers are on their way.</h2><p>Our latest promotions will appear here when announced.</p><Link className="text-link" href="/products">Explore the product catalogue</Link></div>}</section></main>}
