export type Entity = { id: string; [key: string]: unknown };
export type Order = { id: string; number: string; createdAt: string; status: string; totalPaisa: number; promoCode?: string; riderId?: string; user?: { name: string; email: string }; rider?: { name: string }; shipping?: { name?: string; phone?: string; address?: string; city?: string; notes?: string }; items?: { id: string; name: string; quantity: number; unitPricePaisa: number }[] };
export const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
export const label = (value: unknown) => String(value ?? '').replaceAll('_', ' ');
export const paisa = (value: unknown) => `Rs. ${(Number(value ?? 0) / 100).toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export function downloadCSV(filename: string, rows: unknown[][]) {
  const safe = (value: unknown) => { const s = String(value ?? ''); return `"${(/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`; };
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}
