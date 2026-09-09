import type {Metadata} from 'next';
import {SiteChrome} from '@/components/site-chrome';
import {CartProvider} from '@/components/shop/cart-provider';
import {getSettings} from '@/lib/server/catalog';
import {siteUrl} from '@/lib/site';
import './globals.css';
import './shop.css';
import './dashboard.css';
import './content-manager.css';
import './pagination.css';
import './home-refinements.css';
import './site-updates.css';
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:'Alpha Lubricants Nepal | Performance. Protection. Power.',template:'%s | Alpha Lubricants Nepal'},description:'Explore Alpha motorcycle engine oils and semi synthetic lubricants in Nepal. Shop the Alpha range, find oil guidance and connect with our team in Tinkune, Kathmandu.',openGraph:{type:'website',locale:'en_NP',siteName:'Alpha Lubricants',images:[{url:'/images/alpha-racing.webp',width:1920,height:820,alt:'Alpha Lubricants — performance for Nepal’s roads'}]},twitter:{card:'summary_large_image'},robots:{index:true,follow:true}};
export default async function RootLayout({children}:{children:React.ReactNode}){const settings=await getSettings();return <html lang="en-NP" data-scroll-behavior="smooth"><body><CartProvider><SiteChrome settings={settings}>{children}</SiteChrome></CartProvider></body></html>}
