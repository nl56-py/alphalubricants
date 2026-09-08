import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/server/db';
import { adminGuard } from '@/lib/server/admin';
import { route, readJson, requireDatabase } from '@/lib/server/http';
import { defaultHomeMedia, getHomeMedia, HomeMediaSettings } from '@/lib/server/catalog';

export const GET = route(async request => {
  await adminGuard(request);
  requireDatabase();
  const homeMedia = await getHomeMedia();
  return NextResponse.json({ homeMedia });
});

export const PUT = route(async request => {
  const actor = await adminGuard(request, true);
  requireDatabase();
  const raw = (await readJson(request)) as Partial<HomeMediaSettings>;
  const clean: HomeMediaSettings = {
    performanceImage: String(raw.performanceImage || defaultHomeMedia.performanceImage).trim(),
    partnershipImage: String(raw.partnershipImage || defaultHomeMedia.partnershipImage).trim(),
    categoryMotorcycleImage: String(raw.categoryMotorcycleImage || defaultHomeMedia.categoryMotorcycleImage).trim(),
    categoryOffroadImage: String(raw.categoryOffroadImage || defaultHomeMedia.categoryOffroadImage).trim(),
    categoryTrackImage: String(raw.categoryTrackImage || defaultHomeMedia.categoryTrackImage || '/images/alpha-racing.webp').trim(),
    categoryIndustrialImage: String(raw.categoryTrackImage || raw.categoryIndustrialImage || defaultHomeMedia.categoryIndustrialImage || '').trim(),
    dealershipBannerImage: String(raw.dealershipBannerImage || defaultHomeMedia.dealershipBannerImage || '/images/dealearship banner.jpg').trim(),
    heritagePerformanceImage: String(raw.heritagePerformanceImage || defaultHomeMedia.heritagePerformanceImage).trim(),
    heritageProtectionImage: String(raw.heritageProtectionImage || defaultHomeMedia.heritageProtectionImage).trim(),
    heritagePowerImage: String(raw.heritagePowerImage || defaultHomeMedia.heritagePowerImage).trim(),
  };

  await db.$transaction(async tx => {
    await tx.setting.upsert({
      where: { key: 'home_media' },
      create: { key: 'home_media', value: clean },
      update: { value: clean }
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'HOME_MEDIA_UPDATE',
        entityId: 'home_media',
        details: clean
      }
    });
  });

  revalidateTag('home_media', { expire: 0 });
  revalidateTag('settings', { expire: 0 });
  return NextResponse.json({ homeMedia: clean });
});
