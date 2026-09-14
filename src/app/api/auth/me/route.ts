import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/server/auth';
import { route } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = route(async () =>
  NextResponse.json(
    { user: await currentUser() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    }
  )
);

