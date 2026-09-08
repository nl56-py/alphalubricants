import { PrismaClient, ContentType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { defaultSettings, fallbackContent, fallbackProducts } from '../src/lib/server/public-data';

try { process.loadEnvFile('.env'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
const db = new PrismaClient();
async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before seeding.');
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set a valid ADMIN_EMAIL.');
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    if (!password || password.length < 12 || Buffer.byteLength(password) > 72) throw new Error('Set ADMIN_PASSWORD to a unique password of at least 12 characters (at most 72 UTF-8 bytes).');
    await db.user.create({ data: { email, name: process.env.ADMIN_NAME || 'Alpha Administrator', passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  } else if (existing.role !== 'ADMIN') throw new Error('ADMIN_EMAIL belongs to a non-admin user. Choose another email.');
  await db.setting.upsert({ where: { key: 'site' }, create: { key: 'site', value: defaultSettings }, update: {} });
  for (const product of fallbackProducts) await db.product.upsert({ where: { slug: product.slug }, create: product, update: {} });
  for (const content of fallbackContent) await db.content.upsert({ where: { slug: content.slug }, create: { ...content, type: content.type as ContentType }, update: {} });
  console.log('Initial catalog, content, site settings and admin are ready. Existing records and passwords were preserved.');
  console.log('Products begin with zero stock. Verify descriptions, prices and stock in the admin before accepting orders.');
}
seed().catch(error => { console.error(error instanceof Error ? error.message : 'Seed failed.'); process.exitCode = 1; }).finally(() => db.$disconnect());
