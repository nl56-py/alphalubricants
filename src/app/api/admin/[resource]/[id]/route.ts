import { NextResponse } from 'next/server';
import { route, readJson } from '@/lib/server/http';
import { adminGuard, mutateResource, resourceName } from '@/lib/server/admin';
export const PATCH = route(async (request, context) => { const actor = await adminGuard(request, true); const { resource, id } = await context.params; return NextResponse.json({ item: await mutateResource(resourceName(resource), actor.id, await readJson(request), id) }); });
export const DELETE = route(async (request, context) => { const actor = await adminGuard(request, true); const { resource, id } = await context.params; await mutateResource(resourceName(resource), actor.id, {}, id, true); return NextResponse.json({ ok: true }); });
