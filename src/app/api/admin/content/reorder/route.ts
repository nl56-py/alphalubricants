import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/server/db';
import { adminGuard } from '@/lib/server/admin';
import { readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0).max(100000),
    })
  ).min(1),
});

export const PUT = route(async request => {
  validateOrigin(request);
  const actor = await adminGuard(request, true);
  requireDatabase();

  const body = await readJson(request);
  const { items } = reorderSchema.parse(body);

  await db.$transaction(async tx => {
    for (const item of items) {
      await tx.content.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'HERO_CONTENT_REORDER',
        entityId: 'content',
        details: { count: items.length },
      },
    });
  });

  revalidateTag('content', { expire: 0 });
  return NextResponse.json({ success: true, count: items.length });
});
