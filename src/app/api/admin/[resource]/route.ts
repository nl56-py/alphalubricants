import { NextResponse } from 'next/server';
import { route, readJson } from '@/lib/server/http';
import { adminGuard, listResource, mutateResource, resourceName } from '@/lib/server/admin';
export const GET = route(async (request, context) => { await adminGuard(request); return NextResponse.json(await listResource(resourceName((await context.params).resource), request)); });
export const POST = route(async (request, context) => { const actor = await adminGuard(request, true); const item = await mutateResource(resourceName((await context.params).resource), actor.id, await readJson(request)); return NextResponse.json({ item }, { status: 201 }); });
