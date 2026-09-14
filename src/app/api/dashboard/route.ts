import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db';
import { requireUser, userSelect } from '@/lib/server/auth';
import { requireDatabase, route } from '@/lib/server/http';
import { orderScope } from '@/lib/server/order-policy';
export const GET = route(async () => {
  requireDatabase(); const user = await requireUser(['ADMIN', 'RIDER']); const scope = orderScope(user);
  const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - 29);
  const [orders, revenue, pendingOrders, customers, products, lowStock, recentOrders, grouped, recentDelivered, promos, promoOrders, promoSalesByCode] = await Promise.all([
    db.order.count({ where: scope }),
    db.order.aggregate({ where: { ...scope, status: 'DELIVERED' }, _sum: { totalPaisa: true } }),
    db.order.count({ where: { ...scope, status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] } } }),
    user.role === 'ADMIN' ? db.user.count({ where: { role: 'CUSTOMER' } }) : Promise.resolve(0),
    user.role === 'ADMIN' ? db.product.count({ where: { active: true } }) : Promise.resolve(0),
    user.role === 'ADMIN' ? db.product.count({ where: { active: true, stock: { lte: 5 } } }) : Promise.resolve(0),
    db.order.findMany({ where: scope, take: 8, orderBy: { createdAt: 'desc' }, include: { items: true, user: { select: userSelect }, rider: { select: userSelect } } }),
    db.order.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
    db.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: since },
        ...(user.role === 'RIDER' ? { OR: [{ riderId: user.id }, { referredById: user.id }] } : {})
      },
      select: { createdAt: true, totalPaisa: true }
    }),
    db.promo.findMany({ where: user.role === 'RIDER' ? { riderId: user.id } : {}, take: 100, orderBy: { createdAt: 'desc' }, include: { rider: { select: userSelect } } }),
    user.role === 'RIDER' ? db.order.findMany({ where: { referredById: user.id }, take: 40, orderBy: { createdAt: 'desc' }, include: { items: true, user: { select: userSelect } } }) : Promise.resolve([]),
    user.role === 'RIDER' ? db.order.groupBy({ by: ['promoCode'], where: { referredById: user.id }, _sum: { totalPaisa: true }, _count: { _all: true } }) : Promise.resolve([]),
  ]);
  const sales = Array.from({ length: 30 }, (_, i) => { const date = new Date(since); date.setUTCDate(date.getUTCDate() + i); return { date: date.toISOString().slice(0, 10), totalPaisa: 0, orders: 0 }; });
  for (const order of recentDelivered) {
    const dateStr = order.createdAt.toISOString().slice(0, 10);
    const day = sales.find(day => day.date === dateStr);
    if (day) {
      day.totalPaisa += order.totalPaisa;
      day.orders += 1;
    }
  }
  const enrichedPromos = promos.map(p => {
    const stat = (promoSalesByCode as { promoCode: string | null; _sum: { totalPaisa: number | null }; _count: { _all: number } }[]).find(s => s.promoCode === p.code);
    return { ...p, revenuePaisa: stat?._sum.totalPaisa ?? 0, ordersCount: stat?._count._all ?? p.usedCount };
  });
  const promoRevenuePaisa = (promoOrders as { totalPaisa: number }[]).reduce((sum, o) => sum + o.totalPaisa, 0);
  return NextResponse.json({
    metrics: {
      orders,
      revenuePaisa: revenue._sum.totalPaisa ?? 0,
      promoRevenuePaisa,
      promoOrdersCount: (promoOrders as unknown[]).length,
      pendingOrders,
      customers,
      products,
      lowStock
    },
    recentOrders,
    promoOrders,
    sales,
    statusCounts: grouped.map(group => ({ status: group.status, count: group._count._all })),
    promos: enrichedPromos
  });
});
