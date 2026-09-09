import Link from 'next/link';

export function PagePagination({ page, total, pageSize, path, parameter = 'page', query = {} }: { page: number; total: number; pageSize: number; path: string; parameter?: string; query?: Record<string, string | number | undefined> }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (value: number) => {
    const params = new URLSearchParams();
    for (const [key, entry] of Object.entries(query)) if (entry !== undefined && entry !== '') params.set(key, String(entry));
    if (value > 1) params.set(parameter, String(value));
    const suffix = params.toString();
    return `${path}${suffix ? `?${suffix}` : ''}`;
  };
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(value => value === 1 || value === pages || Math.abs(value - page) <= 1);
  return <nav className="site-pagination" aria-label="Pagination">
    <Link href={href(Math.max(1, page - 1))} aria-disabled={page === 1} className={page === 1 ? 'disabled' : ''}>Previous</Link>
    <div>{visible.map((value, index) => <span key={value}>{index > 0 && value - visible[index - 1] > 1 && <i>…</i>}<Link href={href(value)} aria-current={value === page ? 'page' : undefined}>{value}</Link></span>)}</div>
    <Link href={href(Math.min(pages, page + 1))} aria-disabled={page === pages} className={page === pages ? 'disabled' : ''}>Next</Link>
  </nav>;
}
