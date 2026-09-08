import type {Metadata} from 'next';
import {getContent} from '@/lib/server/catalog';
import {PageBanner} from '@/components/page-banner';
import {Gallery} from '@/components/gallery';
import {VideoCards} from '@/components/cms-sections';
export const revalidate=120;
export const metadata:Metadata={title:'Alpha Gallery & Videos',description:'Explore Alpha Lubricants product photography, community moments and videos from Nepal.',alternates:{canonical:'/gallery'}};
export default async function GalleryPage(){const [images,videos]=await Promise.all([getContent('GALLERY'),getContent('VIDEO')]);return <main id="main-content"><PageBanner title="Alpha. In focus." eyebrow="GALLERY & VIDEOS" description="The products. The people. A closer look at our world."/><section className="wrap content-section"><Gallery items={images}/><h2 style={{marginTop:65}}>From the <span>ride.</span></h2>{videos.length?<VideoCards items={videos}/>:<p className="empty-content">Our next chapter is on the way. Follow Alpha on Facebook for the latest rider stories and videos.</p>}</section></main>}
