import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient, ContentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDataPath = path.join(__dirname, '..', 'src', 'lib', 'server', 'public-data.ts');
const publicDataSource = fs.readFileSync(publicDataPath, 'utf8').replaceAll('export const ', 'const ');
const { fallbackProducts, fallbackContent, defaultSettings } = Function(
  `${publicDataSource}; return { fallbackProducts, fallbackContent, defaultSettings };`,
)();

const db = new PrismaClient();

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before seeding.');

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set a valid ADMIN_EMAIL.');

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    if (!password || password.length < 12 || Buffer.byteLength(password) > 72) {
      throw new Error('Set ADMIN_PASSWORD to a unique password of at least 12 characters (at most 72 UTF-8 bytes).');
    }
    await db.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME || 'Alpha Administrator',
        passwordHash: await bcrypt.hash(password, 12),
        role: 'ADMIN',
      },
    });
  } else if (existing.role !== 'ADMIN') {
    throw new Error('ADMIN_EMAIL belongs to a non-admin user. Choose another email.');
  }

  await db.setting.upsert({ where: { key: 'site' }, create: { key: 'site', value: defaultSettings }, update: {} });
  for (const product of fallbackProducts) await db.product.upsert({ where: { slug: product.slug }, create: product, update: {} });

  const heroSlugs = fallbackContent.filter((content) => content.type === 'HERO').map((content) => content.slug);
  await db.content.deleteMany({ where: { type: 'HERO', slug: { notIn: heroSlugs } } });
  for (const content of fallbackContent) {
    const data = { ...content, type: ContentType[content.type] };
    await db.content.upsert({ where: { slug: content.slug }, create: data, update: content.type === 'HERO' ? data : {} });
  }

  // Seed official Alpha Riders into User and Promo tables
  const defaultRiders = [
    {
      email: 'meengma53@alphalubricants.local',
      name: 'Meengma #53',
      phone: '+977 9801000053',
      image: '/images/rider-meengma.jpg',
      bio: 'Power meets the track 🔥🏁 Alpha Rider #53 proudly representing Alpha Lubricants—built to perform when the ride gets tough. 🐺🏍️',
      promoCode: 'ALPHA-MEENGMA53',
    },
    {
      email: 'ruby07@alphalubricants.local',
      name: 'Ruby #07',
      phone: '+977 9801000007',
      image: '/images/rider-ruby.jpg',
      bio: 'Power meets the track 🔥🏁 Alpha Rider #07 proudly representing Alpha Lubricants on every circuit, in every condition. 🐺🏍️',
      promoCode: 'ALPHA-RUBY07',
    },
  ];

  const riderPasswordHash = await bcrypt.hash('AlphaRider2026!', 12);
  for (const rider of defaultRiders) {
    let user = await db.user.findUnique({ where: { email: rider.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: rider.email,
          name: rider.name,
          phone: rider.phone,
          image: rider.image,
          bio: rider.bio,
          role: 'RIDER',
          active: true,
          passwordHash: riderPasswordHash,
        },
      });
    } else {
      await db.user.update({
        where: { id: user.id },
        data: {
          name: rider.name,
          image: rider.image,
          bio: rider.bio,
          role: 'RIDER',
          active: true,
        },
      });
    }

    await db.promo.upsert({
      where: { code: rider.promoCode },
      create: {
        code: rider.promoCode,
        type: 'PERCENT',
        value: 10,
        active: true,
        riderId: user.id,
      },
      update: {
        riderId: user.id,
        active: true,
      },
    });
  }

  await db.content.deleteMany({ where: { type: 'RIDER_PROFILE' } });

  console.log('Initial catalog, content, site settings, riders and admin are ready. Existing records and passwords were preserved.');
  console.log('Products begin with zero stock. Verify descriptions, prices and stock in the admin before accepting orders.');
}

seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Seed failed.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
