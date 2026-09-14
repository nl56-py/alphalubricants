import { ContentType, Prisma } from '@prisma/client';

import { unstable_cache } from 'next/cache';
import { db, hasDatabase } from './db';
import { defaultSettings, fallbackContent, fallbackProducts } from './public-data';

async function withFallback<T>(query: () => Promise<unknown>, fallback: T): Promise<T> {
  if (!hasDatabase()) return fallback;
  try {
    return await query() as T;
  } catch (error) {
    console.error('[catalog]', error instanceof Error ? error.message : 'Database unavailable');
    return fallback;
  }
}

export const getProducts = unstable_cache(async () => {
  return withFallback(() => db.product.findMany({ where: { active: true }, orderBy: [{ featured: 'desc' }, { name: 'asc' }] }), fallbackProducts);
}, ['products-stock-update'], { revalidate: 120, tags: ['products'] });
export async function getProductBySlug(slug: string) { return (await getProducts()).find(product => product.slug === slug) ?? null; }
export const getContent = unstable_cache(async (type?: ContentType) => {
  return withFallback(() => db.content.findMany({ where: { published: true, ...(type ? { type } : {}) }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }), fallbackContent.filter(item => !type || item.type === type));
}, ['content-hero-v4'], { revalidate: 120, tags: ['content'] });
export const getSettings = unstable_cache(async () => {
  const record = await withFallback<{ value: unknown } | null>(() => db.setting.findUnique({ where: { key: 'site' } }), null);
  return { ...defaultSettings, ...(record?.value as Partial<typeof defaultSettings> ?? {}) };
}, ['settings'], { revalidate: 120, tags: ['settings'] });

export type HomeMediaSettings = {
  performanceImage: string;
  partnershipImage: string;
  categoryMotorcycleImage: string;
  categoryOffroadImage: string;
  categoryTrackImage?: string;
  categoryIndustrialImage?: string;
  dealershipBannerImage?: string;
  heritagePerformanceImage: string;
  heritageProtectionImage: string;
  heritagePowerImage: string;
};

export const defaultHomeMedia: HomeMediaSettings = {
  performanceImage: '/images/hero 16 9.jpg',
  partnershipImage: '/images/riders.jpg',
  categoryMotorcycleImage: '/images/motor cycle.jpg',
  categoryOffroadImage: '/images/off roading.jpeg',
  categoryTrackImage: '/images/alpha-racing.webp',
  categoryIndustrialImage: '/images/alpha-racing.webp',
  dealershipBannerImage: '/images/dealearship banner.jpg',
  heritagePerformanceImage: '/images/Driven by passion..jpg',
  heritageProtectionImage: '/images/product-sl.webp',
  heritagePowerImage: '/images/hero-road.webp',
};

export const getHomeMedia = unstable_cache(async (): Promise<HomeMediaSettings> => {
  const record = await withFallback<{ value: unknown } | null>(() => db.setting.findUnique({ where: { key: 'home_media' } }), null);
  return { ...defaultHomeMedia, ...(record?.value as Partial<HomeMediaSettings> ?? {}) };
}, ['home_media'], { revalidate: 120, tags: ['settings', 'home_media'] });

export const getActivePromos = unstable_cache(async () => {
  const now = new Date();
  return withFallback(() => db.promo.findMany({
    where: {
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    },
    include: {
      rider: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' }
  }), []);
}, ['active-promos'], { revalidate: 60, tags: ['promos'] });

export type FeaturedRider = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
};

export const fallbackFeaturedRiders: FeaturedRider[] = [
  {
    id: 'rider-meengma',
    name: 'Meengma #53',
    image: '/images/rider-meengma.jpg',
    bio: 'Power meets the track 🔥🏁 Alpha Rider #53 proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️',
  },
  {
    id: 'rider-ruby',
    name: 'Ruby #07',
    image: '/images/rider-ruby.jpg',
    bio: 'Power meets the track 🔥🏁 Alpha Rider #07 proudly representing Alpha Lubricants on every circuit, in every condition. 🐺🏍️',
  },
];

export const getFeaturedRiders = unstable_cache(async (): Promise<FeaturedRider[]> => {
  if (!hasDatabase()) return fallbackFeaturedRiders;
  try {
    const riders = await db.$queryRaw<
      { id: string; name: string; image: string | null; bio: string | null }[]
    >(Prisma.sql`
      SELECT u.id, u.name, u.image, u.bio
      FROM \`User\` u
      WHERE u.role = 'RIDER' AND u.active = 1
      ORDER BY u.name ASC
      LIMIT 8
    `);
    if (!riders.length) return fallbackFeaturedRiders;
    return riders.map(r => ({
      id: r.id,
      name: r.name,
      image: r.image,
      bio: r.bio,
    }));
  } catch (err) {
    console.error('Failed to query featured riders:', err);
    return fallbackFeaturedRiders;
  }
}, ['featured-riders'], { revalidate: 60, tags: ['riders'] });
