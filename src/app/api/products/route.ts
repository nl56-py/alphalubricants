import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/server/catalog';
import { route } from '@/lib/server/http';
export const GET = route(async () => NextResponse.json({ products: await getProducts() }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }));
