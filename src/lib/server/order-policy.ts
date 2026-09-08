export type Status = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
const transitions: Record<Status, Status[]> = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['SHIPPED', 'CANCELLED'], SHIPPED: ['DELIVERED'], DELIVERED: [], CANCELLED: [] };
export function canTransition(from: Status, to: Status, role: string) {
  if (from === to) return true;
  if (role === 'RIDER') return from === 'SHIPPED' && to === 'DELIVERED';
  return role === 'ADMIN' && transitions[from].includes(to);
}
export function orderScope(user: { id: string; role: string }) {
  return user.role === 'ADMIN' ? {} : user.role === 'RIDER' ? { OR: [{ riderId: user.id }, { referredById: user.id }] } : { userId: user.id };
}
