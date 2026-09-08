import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/server/auth';
import { route, validateOrigin } from '@/lib/server/http';
export const POST = route(async request => { validateOrigin(request); await destroySession(); return NextResponse.json({ ok: true }); });
