import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {getContent} from '@/lib/server/catalog';
import {PageBanner} from '@/components/page-banner';
export const revalidate=120;
export const metadata:Metadata={title:'Engine Oil Insights & Lubricant Guides',description:'Understand motorcycle engine oil, maintenance and lubricant choices for Nepal with Alpha’s practical guides.',alternates:{canonical:'/blog'}};
export default async function Blog(){const posts=await getContent('BLOG');return <main id="main-content"><PageBanner title="Knowledge that moves you." eyebrow="ALPHA INSIGHTS" description="A closer look at engine care, the right oil and the road ahead."/><div className="wrap content-section editorial-grid">{posts.map(p=><article key={p.id} className="editorial-card"><Link href={`/blog/${p.slug}`} className="editorial-image"><Image src={p.image||'/images/alpha-track.webp'} alt={p.title} fill sizes="(max-width:700px) 90vw, 33vw"/></Link><p className="eyebrow">ENGINE CARE</p><h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2><p>{p.excerpt}</p><Link href={`/blog/${p.slug}`} className="text-link">Read the story <ArrowUpRight size={17}/></Link></article>)}</div>{!posts.length&&<p className="wrap empty-content">New stories are on their way. Follow the Alpha community for updates.</p>}</main>}
