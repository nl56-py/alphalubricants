try { process.loadEnvFile('.env'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('AlphaRider2026!@#', 10);

  // Official Alpha Lubricants Riders:
  // "Power meets the track 🔥🏁 Meet Meengma #53 & Ruby #07, proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️"
  const officialRiders = [
    {
      name: 'Meengma #53',
      email: 'meengma.53@alpha.local',
      phone: '+977 9801122334',
      image: '/images/rider-meengma.jpg',
      bio: 'Power meets the track 🔥🏁 Alpha Rider #53 proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️',
      promoCode: 'ALPHA-MEENGMA53',
    },
    {
      name: 'Ruby #07',
      email: 'ruby.07@alpha.local',
      phone: '+977 9841234567',
      image: '/images/rider-ruby.jpg',
      bio: 'Power meets the track 🔥🏁 Alpha Rider #07 proudly representing Alpha Lubricants on every circuit, in every condition. 🐺🏍️',
      promoCode: 'ALPHA-RUBY07',
    },
  ];

  const officialEmails = officialRiders.map(r => r.email);

  // Clean out any old mock / placeholder riders so ONLY Meengma #53 and Ruby #07 exist
  const oldRiders = await db.user.findMany({
    where: {
      role: 'RIDER',
      email: { notIn: officialEmails },
    },
    select: { id: true },
  });

  if (oldRiders.length > 0) {
    const oldIds = oldRiders.map(u => u.id);
    await db.promo.deleteMany({
      where: { riderId: { in: oldIds } },
    });
    await db.user.deleteMany({
      where: { id: { in: oldIds } },
    });
    console.log(`Cleaned up ${oldRiders.length} old mock riders and their promo codes.`);
  }

  // Seed the 2 official riders
  for (const r of officialRiders) {
    const user = await db.user.upsert({
      where: { email: r.email },
      update: {
        name: r.name,
        phone: r.phone,
        image: r.image,
        bio: r.bio,
        role: 'RIDER',
        active: true,
      },
      create: {
        name: r.name,
        email: r.email,
        phone: r.phone,
        image: r.image,
        bio: r.bio,
        passwordHash,
        role: 'RIDER',
        active: true,
      },
    });

    if (r.promoCode) {
      await db.promo.upsert({
        where: { code: r.promoCode },
        update: { riderId: user.id, active: true },
        create: {
          code: r.promoCode,
          type: 'PERCENT',
          value: 10,
          riderId: user.id,
          active: true,
        },
      });
    }
  }

  // Also seed RIDER_PROFILE items in Content table for /community
  const riderProfiles = [
    {
      id: 'rider-meengma-53',
      type: 'RIDER_PROFILE' as const,
      slug: 'meengma-53',
      title: 'Meengma #53',
      excerpt: 'Built to perform when the ride gets tough. Official Alpha Lubricants rider representing power and precision on the track.',
      body: 'Power meets the track 🔥🏁 Meet Meengma #53, proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️',
      image: '/images/rider-meengma.jpg',
      link: '/products',
      published: true,
      sortOrder: 0,
    },
    {
      id: 'rider-ruby-07',
      type: 'RIDER_PROFILE' as const,
      slug: 'ruby-07',
      title: 'Ruby #07',
      excerpt: 'Power meets the track 🔥🏁. Official Alpha Lubricants racer driving high-RPM performance with uncompromising grit.',
      body: 'Meet Ruby #07, proudly representing Alpha Lubricants on every track and in every condition. Backed by Alpha 20W-50 performance engine oil.',
      image: '/images/rider-ruby.jpg',
      link: '/products',
      published: true,
      sortOrder: 1,
    },
  ];

  await db.content.deleteMany({
    where: {
      type: 'RIDER_PROFILE',
      slug: { notIn: riderProfiles.map(p => p.slug) },
    },
  });

  for (const profile of riderProfiles) {
    await db.content.upsert({
      where: { slug: profile.slug },
      update: {
        title: profile.title,
        excerpt: profile.excerpt,
        body: profile.body,
        image: profile.image,
        link: profile.link,
        published: profile.published,
        sortOrder: profile.sortOrder,
      },
      create: profile,
    });
  }

  console.log('Official riders Meengma #53 & Ruby #07 seeded successfully with photos, bios, promo codes, and CMS profiles.');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
