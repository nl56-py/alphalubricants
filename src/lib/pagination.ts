export function paginate<T extends readonly unknown[]>(items: T, rawPage: string | string[] | undefined, pageSize: number): { page: number; total: number; items: Array<T[number]> } {
  const requested = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pages, Number.isInteger(requested) && requested > 0 ? requested : 1);
  return { page, total: items.length, items: items.slice((page - 1) * pageSize, page * pageSize) as Array<T[number]> };
}
