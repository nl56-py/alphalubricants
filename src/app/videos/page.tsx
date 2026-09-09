import type { Metadata } from 'next';
import { getContent } from '@/lib/server/catalog';
import { paginate } from '@/lib/pagination';
import { PageBanner } from '@/components/page-banner';
import { PagePagination } from '@/components/page-pagination';
import { VideoCards } from '@/components/cms-sections';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Alpha Lubricants Videos', description: 'Watch product videos, rider stories and community moments from Alpha Lubricants Nepal.', alternates: { canonical: '/videos' } };

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const query = await searchParams;
  const allItems = await getContent('VIDEO');
  const items = paginate(allItems, query.page, 9);
  return <main id="main-content"><PageBanner title="Every ride has a story." eyebrow="ALPHA VIDEOS" description="Product insights, community moments and stories from the road." /><section className="wrap content-section">{items.total ? <><VideoCards items={items.items} /><PagePagination page={items.page} total={items.total} pageSize={9} path="/videos" /></> : <p className="empty-content">Our next video is on its way. Check back for stories from the Alpha community.</p>}</section></main>;
}
