import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { checkout } from '@/lib/server/checkout';
import { rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
import { checkoutSchema } from '@/lib/server/validation';
export const POST = route(async request => {
  validateOrigin(request); requireDatabase(); const user = await requireUser();
  await rateLimit(request, 'quote', 100, user.id);
  const { order: _order, ...totals } = await checkout(user.id, checkoutSchema.parse(await readJson(request)), true);
  return NextResponse.json(totals);
});
