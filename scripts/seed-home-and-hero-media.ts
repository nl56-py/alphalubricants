import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding home_media setting and hero slides...');

  // 1. Seed home_media setting
  const homeMediaData = {
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

  await db.setting.upsert({
    where: { key: 'home_media' },
    update: { value: homeMediaData },
    create: { key: 'home_media', value: homeMediaData },
  });
  console.log('Upserted home_media setting.');

  // 2. Seed HERO slides
  const heroSlides = [
    {
      id: 'hero-1',
      slug: 'engineered-for-your-journey',
      title: 'Engineered for your journey.',
      excerpt: 'Performance. Protection. Power. Discover Alpha engine oils for every road ahead.',
      image: '/images/hero desk 1.jpg',
      mobileImage: '/images/hero mob img 1.jpg',
      videoUrl: '/video/hero desk 1.mp4',
      link: '/products',
      sortOrder: 0,
      published: true,
    },
    {
      id: 'hero-2',
      slug: 'made-for-the-ride',
      title: 'Made for the ride.',
      excerpt: 'Your next journey starts here. Find the right Alpha engine oil for your motorcycle.',
      image: '/images/hero 16 9.jpg',
      mobileImage: '/images/mob hero 1.jpg',
      videoUrl: '/video/hero desk 2.mp4',
      link: '/products?category=Motorcycle',
      sortOrder: 1,
      published: true,
    },
    {
      id: 'hero-3',
      slug: 'precision-power-protection',
      title: 'Precision power. Uncompromising care.',
      excerpt: 'High-RPM stability and maximum engine life across Nepal’s roads and mountain terrain.',
      image: '/images/hero desk 3.jpg',
      mobileImage: '/images/hero mob img 1.jpg',
      videoUrl: '/video/hero desk 1.mp4',
      link: '/products',
      sortOrder: 2,
      published: true,
    },
  ];

  for (const slide of heroSlides) {
    await db.content.upsert({
      where: { slug: slide.slug },
      update: {
        title: slide.title,
        excerpt: slide.excerpt,
        image: slide.image,
        mobileImage: slide.mobileImage,
        videoUrl: slide.videoUrl,
        link: slide.link,
        sortOrder: slide.sortOrder,
        published: slide.published,
      },
      create: {
        id: slide.id,
        type: 'HERO',
        slug: slide.slug,
        title: slide.title,
        excerpt: slide.excerpt,
        image: slide.image,
        mobileImage: slide.mobileImage,
        videoUrl: slide.videoUrl,
        link: slide.link,
        sortOrder: slide.sortOrder,
        published: slide.published,
      },
    });
    console.log(`Upserted hero slide: ${slide.slug}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding media:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
