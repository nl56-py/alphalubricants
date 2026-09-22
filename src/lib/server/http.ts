import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { db, hasDatabase } from './db';
import { createHash } from 'node:crypto';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function requireDatabase() {
  if (!hasDatabase()) throw new ApiError(503, 'The store database is not connected yet. Please contact Alpha to place an order.');
}
export function validateOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) throw new ApiError(403, 'This request must originate from this website.');

  // 1. Direct match with incoming request URL origin (e.g. http://localhost:3000 or production domain)
  if (origin === request.nextUrl.origin) return;

  // 2. Match with configured APP_URL, NEXT_PUBLIC_SITE_URL, or production domains
  const allowedUrls = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://alphalubricantsnepal.com',
    'https://www.alphalubricantsnepal.com',
    'https://alphalubricant.com',
    'https://www.alphalubricant.com'
  ].filter(Boolean) as string[];
  for (const urlStr of allowedUrls) {
    try {
      if (origin === new URL(urlStr).origin) return;
    } catch { /* ignore invalid URL string */ }
  }

  // 3. In non-production environments, allow localhost / 127.0.0.1 on any local port
  if (process.env.NODE_ENV !== 'production') {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return;
      }
    } catch { /* ignore */ }
  }

  throw new ApiError(403, 'This request must originate from this website.');
}

export async function readJson(request: NextRequest) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ApiError(415, 'Send JSON content.');
  const body = (await readBytes(request, 100_000)).toString('utf8');
  try { return JSON.parse(body) as unknown; } catch { throw new ApiError(400, 'Invalid JSON.'); }
}
export async function readBytes(request: NextRequest, maxBytes: number) {
  if (Number(request.headers.get('content-length') || 0) > maxBytes) throw new ApiError(413, 'Request is too large.');
  const reader = request.body?.getReader(); if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, 'Request is too large.'); } chunks.push(value); }
  return Buffer.concat(chunks);
}
export function route(handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try { const response = await handler(request, context); if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'private, no-store'); return response; }
    catch (error) {
      if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
      if (error instanceof ZodError) return NextResponse.json({ error: 'Please check the form fields.', issues: error.flatten() }, { status: 400 });
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ error: 'A record with these details already exists.' }, { status: 409 });
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
      if (error instanceof Prisma.PrismaClientInitializationError) return NextResponse.json({ error: 'The database is temporarily unavailable. Please try again later.' }, { status: 503 });
      console.error('[api]', error instanceof Error ? error.message : 'Unknown failure');
      return NextResponse.json({ error: 'Unable to complete this request. Please try again.' }, { status: 500 });
    }
  };
}
export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  if (process.env.TRUST_PROXY === 'true') {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  }
  return 'shared';
}

export async function rateLimit(request: NextRequest, action: string, limit: number, identifier = '') {
  const ip = getClientIp(request);
  const bucket = Math.floor(Date.now() / 900_000);
  const key = createHash('sha256').update(`${action}:${ip}:${identifier}:${bucket}`).digest('hex');
  const record = await db.rateLimit.upsert({ where: { key }, create: { key, expiresAt: new Date((bucket + 1) * 900_000) }, update: { count: { increment: 1 } } });
  if (record.count > limit) throw new ApiError(429, 'Too many attempts. Please try again in 15 minutes.');
}
