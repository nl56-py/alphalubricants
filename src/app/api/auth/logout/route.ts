import { NextResponse } from 'next/server';
import { COOKIE, destroySession } from '@/lib/server/auth';
import { route, validateOrigin } from '@/lib/server/http';
export const POST = route(async request => {
  validateOrigin(request);
  await destroySession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
});
