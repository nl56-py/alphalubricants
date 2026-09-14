import { NextResponse } from 'next/server';
import { db, hasDatabase } from '@/lib/server/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (hasDatabase()) await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: hasDatabase() ? 'connected' : 'not-configured' });
  } catch {
    return NextResponse.json({ ok: false, database: 'unavailable' }, { status: 503 });
  }
}
