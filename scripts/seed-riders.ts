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
      email: 'meengma53@alphalubricants.local',
      phone: '+977 9801000053',
      image: '/images/rider-meengma.jpg',
      bio: 'Power meets the track 🔥🏁 Alpha Rider #53 proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️',
      promoCode: 'ALPHA-MEENGMA53',
    },
    {
      name: 'Ruby #07',
      email: 'ruby07@alphalubricants.local',
      phone: '+977 9801000007',
      image: '/images/rider-ruby.jpg',
      bio: 'Power meets the track 🔥🏁 Alpha Rider #07 proudly representing Alpha Lubricants on every circuit, in every condition. 🐺🏍️',
      promoCode: 'ALPHA-RUBY07',
    },
  ];

  const officialEmails = officialRiders.map(r => r.email.toLowerCase());

  // Clean out any old mock / placeholder / duplicate riders so ONLY Meengma #53 and Ruby #07 exist
  const oldRiders = await db.user.findMany({
    where: {
      role: 'RIDER',
      email: { notIn: officialEmails },
    },
    select: { id: true, email: true },
  });

  if (oldRiders.length > 0) {
    const oldIds = oldRiders.map(u => u.id);
    await db.promo.deleteMany({
      where: { riderId: { in: oldIds } },
    });
    await db.order.updateMany({ where: { riderId: { in: oldIds } }, data: { riderId: null } });
    await db.order.updateMany({ where: { referredById: { in: oldIds } }, data: { referredById: null } });
    await db.session.deleteMany({ where: { userId: { in: oldIds } } });
    await db.user.deleteMany({
      where: { id: { in: oldIds } },
    });
    console.log(`Cleaned up ${oldRiders.length} old mock/duplicate riders.`);
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

    // Delete any other riders that might share the same name
    await db.user.deleteMany({
      where: {
        role: 'RIDER',
        name: r.name,
        id: { not: user.id },
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

  // Remove legacy RIDER_PROFILE items from Content table - riders now live in User table
  await db.content.deleteMany({
    where: {
      type: 'RIDER_PROFILE',
    },
  });

  console.log('Official riders Meengma #53 & Ruby #07 seeded successfully into User and Promo tables.');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
