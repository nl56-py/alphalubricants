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
  const configured = process.env.APP_URL;
  const expected = configured ? new URL(configured).origin : request.nextUrl.origin;
  if (!origin || origin !== expected) throw new ApiError(403, 'This request must originate from this website.');
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
export async function rateLimit(request: NextRequest, action: string, limit: number, identifier = '') {
  // Trust a proxy-supplied address only when explicitly configured by the operator.
  const ip = process.env.TRUST_PROXY === 'true' ? (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown') : 'shared';
  const bucket = Math.floor(Date.now() / 900_000);
  const key = createHash('sha256').update(`${action}:${ip}:${identifier}:${bucket}`).digest('hex');
  const record = await db.rateLimit.upsert({ where: { key }, create: { key, expiresAt: new Date((bucket + 1) * 900_000) }, update: { count: { increment: 1 } } });
  if (record.count > limit) throw new ApiError(429, 'Too many attempts. Please try again in 15 minutes.');
}
