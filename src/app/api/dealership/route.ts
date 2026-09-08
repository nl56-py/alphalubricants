import { NextResponse } from 'next/server';
import { dealershipSchema } from '@/lib/dealership';
import { db } from '@/lib/server/db';
import { rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';

export const POST = route(async request => {
  validateOrigin(request);
  requireDatabase();
  await rateLimit(request, 'dealership-submit', 20);
  const data = dealershipSchema.parse(await readJson(request));
  await rateLimit(request, 'dealership-email', 3, data.email);
  await db.dealershipEnquiry.create({ data: { ...data, adminNotes: '' } });
  return NextResponse.json({ message: 'Your enquiry has been received. Our team will contact you using the details provided.' }, { status: 201 });
});
