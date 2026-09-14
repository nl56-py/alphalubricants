'use client';
import { useEffect, useState } from 'react';
import { dealershipStatuses } from '@/lib/dealership';
import { api, dateLabel } from './session';

type Enquiry = { id: string; name: string; email?: string; phone: string; businessName: string; businessPhone?: string; address: string; district?: string; dealershipType?: string; experience?: string; message?: string; status: string; adminNotes?: string; createdAt: string };

export function DealershipManager() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    let active = true; setBusy(true); setError('');
    api<{ items: Enquiry[]; total: number }>(`/api/admin/dealership?page=${page}&pageSize=20&status=${filter}&q=${encodeURIComponent(query)}`)
      .then(result => { if (active) { setItems(result.items); setTotal(result.total); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [page, filter, query, reload]);
  return <><div className="dash-page-heading"><div><span className="dash-eyebrow">PARTNER NETWORK</span><h1>Dealership enquiries.</h1><p>Review business enquiries, record follow-up notes and track applications.</p></div></div><section className="dash-panel"><div className="dash-toolbar"><label className="dash-search"><input aria-label="Search enquiries" placeholder="Search name, business, phone or address..." value={search} onChange={e => setSearch(e.target.value)} /></label><label className="dash-filter"><span>Status</span><select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{dealershipStatuses.map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label></div>{error && <p role="alert" className="dash-error">{error}</p>}{busy ? <p className="dash-empty">Loading enquiries…</p> : !items.length ? <p className="dash-empty">No matching enquiries.</p> : items.map(item => <EnquiryCard key={`${item.id}-${reload}`} item={item} onSave={() => setReload(value => value + 1)} />)}<div className="dash-pagination"><span>{total} enquiries · Page {page} of {Math.max(1, Math.ceil(total / 20))}</span><div><button className="dash-button secondary" disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>Previous</button><button className="dash-button secondary" disabled={page * 20 >= total || busy} onClick={() => setPage(page + 1)}>Next</button></div></div></section></>;
}

function EnquiryCard({ item, onSave }: { item: Enquiry; onSave: () => void }) {
  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.adminNotes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    try { await api('/api/admin/dealership', { method: 'PATCH', body: JSON.stringify({ id: item.id, status, adminNotes: notes }) }); onSave(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <details style={{ padding: '22px 24px', borderBottom: '1px solid #eadfe3' }}><summary style={{ cursor: 'pointer', lineHeight: 1.8 }}><strong>{item.businessName}</strong> {item.address ? `· ${item.address}` : ''} <span className="dash-badge">{item.status.replaceAll('_', ' ')}</span><br /><small>{item.name} · {item.phone} · {dateLabel(item.createdAt)}</small></summary><div style={{ marginTop: 20, display: 'grid', gap: 16 }}><p><strong>Contact person:</strong> {item.name}<br /><strong>Phone:</strong> <a href={`tel:${item.phone.replace(/\s/g, '')}`}>{item.phone}</a>{item.businessPhone && <><br /><strong>Business phone:</strong> <a href={`tel:${item.businessPhone.replace(/\s/g, '')}`}>{item.businessPhone}</a></>}{item.email && <><br /><strong>Email:</strong> <a href={`mailto:${item.email}`}>{item.email}</a></>}</p><p><strong>Business:</strong> {item.businessName}<br /><strong>Address:</strong> {item.address} {item.district ? `(${item.district})` : ''}{item.dealershipType && <><br /><strong>Partnership type:</strong> {item.dealershipType}</>}{item.experience && <><br /><strong>Experience:</strong> {item.experience}</>}</p>{item.message && <p style={{ whiteSpace: 'pre-wrap' }}><strong>Applicant’s message:</strong><br />{item.message}</p>}<label>Status <select aria-label={`Status for ${item.businessName}`} value={status} onChange={e => setStatus(e.target.value)} disabled={busy}>{dealershipStatuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label><label>Internal follow-up notes<textarea aria-label={`Notes for ${item.businessName}`} value={notes} onChange={e => setNotes(e.target.value)} maxLength={5000} rows={4} style={{ display: 'block', width: '100%', padding: 12, marginTop: 8, border: '1px solid #d9cbd0', borderRadius: 5, font: 'inherit' }} /></label>{error && <p role="alert" className="dash-error">{error}</p>}<button className="dash-button" style={{ justifySelf: 'start' }} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save enquiry'}</button></div></details>;
}
