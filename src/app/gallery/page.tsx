import type { Metadata } from 'next';
import { getContent } from '@/lib/server/catalog';
import { paginate } from '@/lib/pagination';
import { PageBanner } from '@/components/page-banner';
import { PagePagination } from '@/components/page-pagination';
import { Gallery } from '@/components/gallery';
import { VideoCards } from '@/components/cms-sections';

export const revalidate = 120;
export const metadata: Metadata = { title: 'Alpha Gallery & Videos', description: 'Explore Alpha Lubricants product photography, community moments and videos from Nepal.', alternates: { canonical: '/gallery' } };

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ imagePage?: string | string[]; videoPage?: string | string[] }> }) {
  const query = await searchParams;
  const [allImages, allVideos] = await Promise.all([getContent('GALLERY'), getContent('VIDEO')]);
  const images = paginate(allImages, query.imagePage, 12);
  const videos = paginate(allVideos, query.videoPage, 8);
  return <main id="main-content"><PageBanner title="Alpha. In focus." eyebrow="GALLERY & VIDEOS" description="The products. The people. A closer look at our world." /><section className="wrap content-section"><Gallery items={images.items} /><PagePagination page={images.page} total={images.total} pageSize={12} path="/gallery" parameter="imagePage" query={{ videoPage: Array.isArray(query.videoPage) ? query.videoPage[0] : query.videoPage }} /><h2 style={{ marginTop: 65 }}>From the <span>ride.</span></h2>{videos.total ? <><VideoCards items={videos.items} /><PagePagination page={videos.page} total={videos.total} pageSize={8} path="/gallery" parameter="videoPage" query={{ imagePage: Array.isArray(query.imagePage) ? query.imagePage[0] : query.imagePage }} /></> : <p className="empty-content">Our next chapter is on the way. Follow Alpha on Facebook for the latest rider stories and videos.</p>}</section></main>;
}
