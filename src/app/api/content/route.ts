import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getContent } from '@/lib/server/catalog';
import { route } from '@/lib/server/http';
export const GET = route(async request => {
  const raw = request.nextUrl.searchParams.get('type');
  const type = raw ? z.enum(['HERO', 'BLOG', 'GALLERY', 'VIDEO', 'OFFER', 'REVIEW', 'SOCIAL', 'RIDER_PROFILE']).parse(raw) : undefined;
  return NextResponse.json({ content: await getContent(type) }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } });
});
