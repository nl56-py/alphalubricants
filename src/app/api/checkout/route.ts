import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { currentUser } from '@/lib/server/auth';
import { checkout } from '@/lib/server/checkout';
import { rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
import { checkoutSchema } from '@/lib/server/validation';

export const POST = route(async request => {
  validateOrigin(request);
  requireDatabase();
  const input = checkoutSchema.parse(await readJson(request));

  const user = await currentUser();
  const actorIdentifier = user?.id || input.shipping.phone;
  await rateLimit(request, 'checkout', 20, actorIdentifier);
  const result = await checkout(user?.id ?? null, input);

  revalidateTag('products', { expire: 0 });
  return NextResponse.json({ order: result.order }, { status: 201 });
});

