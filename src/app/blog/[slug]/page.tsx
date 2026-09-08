import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getContent} from '@/lib/server/catalog';
import {PageBanner} from '@/components/page-banner';
import {jsonLd,siteUrl} from '@/lib/site';
export const revalidate=120;
async function postFor(slug:string){return(await getContent('BLOG')).find(p=>p.slug===slug)}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params,p=await postFor(slug);return {title:p?.title||'Story not found',description:p?.excerpt||undefined,alternates:{canonical:`/blog/${slug}`},openGraph:{type:'article',title:p?.title,images:p?.image?[p.image]:undefined}}}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params,p=await postFor(slug);if(!p)notFound();return <main id="main-content"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({'@context':'https://schema.org','@type':'Article',headline:p.title,description:p.excerpt,image:p.image?new URL(p.image,siteUrl).href:undefined,author:{'@type':'Organization',name:'Alpha Lubricants'},publisher:{'@type':'Organization',name:'Alpha Lubricants',logo:{'@type':'ImageObject',url:`${siteUrl}/images/logo.webp`}},mainEntityOfPage:`${siteUrl}/blog/${slug}`})}}/><PageBanner title={p.title} description={p.excerpt||undefined} eyebrow="ALPHA INSIGHTS • ENGINE CARE"/><div className="wrap"><article className="article">{p.image&&<div className="article-image"><Image src={p.image} alt={p.title} fill sizes="(max-width:850px) 90vw, 800px" priority/></div>}<p className="eyebrow">BY THE ALPHA TEAM</p>{p.body?.split(/\n\s*\n/).map((paragraph,i)=>paragraph.startsWith('## ')?<h2 key={i}>{paragraph.slice(3)}</h2>:<p key={i}>{paragraph}</p>)}<hr/><p>Need help choosing a compatible product? <Link href="/contact" className="text-link">Contact Alpha in Kathmandu</Link> or <Link href="/products" className="text-link">explore the range.</Link></p><Link href="/blog" className="outline-button">Back to all insights</Link></article></div></main>}
