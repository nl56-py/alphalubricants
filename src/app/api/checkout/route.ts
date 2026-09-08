import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { currentUser } from '@/lib/server/auth';
import { checkout } from '@/lib/server/checkout';
import { db } from '@/lib/server/db';
import { rateLimit, readJson, requireDatabase, route, validateOrigin } from '@/lib/server/http';
import { checkoutSchema } from '@/lib/server/validation';

export const POST = route(async request => {
  validateOrigin(request);
  requireDatabase();
  const input = checkoutSchema.parse(await readJson(request));

  let user = await currentUser();
  if (!user) {
    // Guest checkout: find or automatically create customer user account
    const cleanPhone = input.shipping.phone.replace(/[^0-9+]/g, '');
    const guestEmail = input.shipping.email?.trim().toLowerCase() || `${cleanPhone || Date.now()}@guest.alphalubricants.com`;

    let customer = await db.user.findUnique({ where: { email: guestEmail } });
    if (!customer) {
      const randomSecret = randomBytes(24).toString('hex');
      const passwordHash = await bcrypt.hash(randomSecret, 10);
      customer = await db.user.create({
        data: {
          name: input.shipping.name,
          email: guestEmail,
          phone: input.shipping.phone,
          passwordHash,
          role: 'CUSTOMER',
          active: true,
        },
      });
    }
    user = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: customer.role,
      phone: customer.phone,
    };
  }

  const actorId = user!.id;
  await rateLimit(request, 'checkout', 20, actorId);
  const result = await checkout(actorId, input);

  revalidateTag('products', { expire: 0 });
  return NextResponse.json({ order: result.order }, { status: 201 });

});

