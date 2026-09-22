import type {Metadata} from 'next';
import {SiteChrome} from '@/components/site-chrome';
import {CartProvider} from '@/components/shop/cart-provider';
import {getSettings} from '@/lib/server/catalog';
import {defaultDescription,siteName,siteUrl} from '@/lib/site';
import './globals.css';
import './shop.css';
import './dashboard.css';
import './content-manager.css';
import './pagination.css';
import './home-refinements.css';
import './site-updates.css';
export const metadata:Metadata={metadataBase:new URL(siteUrl),applicationName:siteName,title:{default:'Alpha Lubricants Nepal | Performance. Protection. Power.',template:'%s | Alpha Lubricants Nepal'},description:defaultDescription,alternates:{canonical:'/'},icons:{icon:[{url:'/favicon.ico',sizes:'any'},{url:'/favicon-16x16.png',type:'image/png',sizes:'16x16'},{url:'/favicon-32x32.png',type:'image/png',sizes:'32x32'},{url:'/icon.png',type:'image/png',sizes:'192x192'}],apple:[{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}],shortcut:'/favicon.ico'},manifest:'/site.webmanifest',keywords:['Alpha Lubricants','engine oil Nepal','motorcycle oil Nepal','semi synthetic lubricant','Kathmandu lubricants','bike engine oil'],openGraph:{type:'website',url:siteUrl,locale:'en_NP',siteName,description:defaultDescription,images:[{url:'/images/alpha-racing.webp',width:1920,height:820,alt:'Alpha Lubricants performance motorcycle oil for Nepal roads'}]},twitter:{card:'summary_large_image',title:'Alpha Lubricants Nepal',description:defaultDescription,images:['/images/alpha-racing.webp']},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},category:'automotive'};
export default async function RootLayout({children}:{children:React.ReactNode}){const settings=await getSettings();return <html lang="en-NP" data-scroll-behavior="smooth"><body><CartProvider><SiteChrome settings={settings}>{children}</SiteChrome></CartProvider></body></html>}
