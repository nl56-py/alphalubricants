import { ContentType, PrismaClient } from '@prisma/client';
import { defaultHomeMedia } from '../src/lib/server/catalog';
import { fallbackContent } from '../src/lib/server/public-data';

try { process.loadEnvFile('.env'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }

const db = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before seeding.');

  await db.setting.upsert({
    where: { key: 'home_media' },
    update: { value: defaultHomeMedia },
    create: { key: 'home_media', value: defaultHomeMedia },
  });

  const heroContent = fallbackContent.filter(content => content.type === 'HERO');
  await db.content.deleteMany({
    where: { type: 'HERO', slug: { notIn: heroContent.map(content => content.slug) } },
  });

  for (const content of heroContent) {
    const data = { ...content, type: content.type as ContentType };
    await db.content.upsert({ where: { slug: content.slug }, create: data, update: data });
  }

  console.log('Homepage media and responsive hero playlists seeded.');
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : 'Media seed failed.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
