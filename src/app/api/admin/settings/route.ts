import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { route, readJson, validateOrigin } from '@/lib/server/http';
import { adminGuard } from '@/lib/server/admin';
import { getSettings } from '@/lib/server/catalog';
import { settingsSchema } from '@/lib/server/validation';
import { db } from '@/lib/server/db';
export const GET = route(async request => { await adminGuard(request); return NextResponse.json({ settings: await getSettings() }); });
export const PUT = route(async request => {
  validateOrigin(request);
  const actor = await adminGuard(request, true); const settings = settingsSchema.parse(await readJson(request));
  await db.$transaction([db.setting.upsert({ where: { key: 'site' }, create: { key: 'site', value: settings }, update: { value: settings } }), db.auditLog.create({ data: { actorId: actor.id, action: 'SETTINGS_UPDATE', entityId: 'site' } })]);
  revalidateTag('settings', { expire: 0 }); return NextResponse.json({ settings });
});
