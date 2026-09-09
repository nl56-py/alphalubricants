import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getContent } from '@/lib/server/catalog';
import { paginate } from '@/lib/pagination';
import { PageBanner } from '@/components/page-banner';
import { PagePagination } from '@/components/page-pagination';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Engine Oil Insights & Lubricant Guides', description: 'Understand motorcycle engine oil, maintenance and lubricant choices for Nepal with Alpha’s practical guides.', alternates: { canonical: '/blog' } };

export default async function Blog({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const query = await searchParams;
  const allPosts = await getContent('BLOG');
  const posts = paginate(allPosts, query.page, 9);
  return <main id="main-content">
    <PageBanner title="Knowledge that moves you." eyebrow="ALPHA INSIGHTS" description="A closer look at engine care, the right oil and the road ahead." />
    <div className="wrap content-section editorial-grid">{posts.items.map(post => <article key={post.id} className="editorial-card"><Link href={`/blog/${post.slug}`} className="editorial-image"><Image src={post.image || '/images/alpha-track.webp'} alt={post.title} fill sizes="(max-width:700px) 90vw, 33vw" /></Link><p className="eyebrow">ENGINE CARE</p><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="text-link">Read the story <ArrowUpRight size={17} /></Link></article>)}</div>
    {!posts.total ? <p className="wrap empty-content">New stories are on their way. Follow the Alpha community for updates.</p> : <PagePagination page={posts.page} total={posts.total} pageSize={9} path="/blog" />}
  </main>;
}
