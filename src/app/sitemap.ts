import type {MetadataRoute} from 'next';
import {getProducts,getContent} from '@/lib/server/catalog';
import {siteUrl} from '@/lib/site';
export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const [products,posts]=await Promise.all([getProducts(),getContent('BLOG')]);return [...['','/products','/about','/community','/gallery','/blog','/contact','/videos','/oil-finder','/dealership'].map(path=>({url:`${siteUrl}${path}`,changeFrequency:'weekly' as const,priority:path===''?1:.7})),...products.map(p=>({url:`${siteUrl}/products/${p.slug}`,changeFrequency:'weekly' as const,priority:.8})),...posts.map(p=>({url:`${siteUrl}/blog/${p.slug}`,changeFrequency:'monthly' as const,priority:.6}))]}
