import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireUser } from '@/lib/server/auth';
import { checkout } from '@/lib/server/checkout';
import { rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
import { checkoutSchema } from '@/lib/server/validation';
export const POST = route(async request => {
  validateOrigin(request); requireDatabase(); const user = await requireUser();
  await rateLimit(request, 'checkout', 20, user.id);
  const result = await checkout(user.id, checkoutSchema.parse(await readJson(request)));
  revalidateTag('products', { expire: 0 });
  return NextResponse.json({ order: result.order }, { status: 201 });
});
