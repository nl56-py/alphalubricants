import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/server/auth';
import { route } from '@/lib/server/http';
export const GET = route(async () => NextResponse.json({ user: await currentUser() }, { headers: { 'Cache-Control': 'private, no-store' } }));
