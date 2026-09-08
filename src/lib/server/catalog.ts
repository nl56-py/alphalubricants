import { ContentType } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { db, hasDatabase } from './db';
import { defaultSettings, fallbackContent, fallbackProducts } from './public-data';

export const getProducts = unstable_cache(async () => {
  if (!hasDatabase()) return fallbackProducts;
  return db.product.findMany({ where: { active: true }, orderBy: [{ featured: 'desc' }, { name: 'asc' }] });
}, ['products-stock-update'], { revalidate: 120, tags: ['products'] });
export async function getProductBySlug(slug: string) { return (await getProducts()).find(product => product.slug === slug) ?? null; }
export const getContent = unstable_cache(async (type?: ContentType) => {
  if (!hasDatabase()) return fallbackContent.filter(item => !type || item.type === type);
  return db.content.findMany({ where: { published: true, ...(type ? { type } : {}) }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
}, ['content-whatsapp-20260909'], { revalidate: 120, tags: ['content'] });
export const getSettings = unstable_cache(async () => {
  if (!hasDatabase()) return defaultSettings;
  const record = await db.setting.findUnique({ where: { key: 'site' } });
  return { ...defaultSettings, ...(record?.value as Partial<typeof defaultSettings> ?? {}) };
}, ['settings'], { revalidate: 120, tags: ['settings'] });
