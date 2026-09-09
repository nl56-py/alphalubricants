'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, ImagePlus, Images, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { api, dateLabel } from './session';
import type { Entity } from './types';

const contentTypes = ['HERO', 'BLOG', 'GALLERY', 'VIDEO', 'OFFER', 'REVIEW', 'SOCIAL', 'RIDER_PROFILE'] as const;
type ContentType = typeof contentTypes[number];
type HeroTarget = 'desktop' | 'mobile';
type HeroMedia = 'image' | 'video';
type Field = {
  key: string;
  label: string;
  kind?: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image' | 'video';
  options?: string[];
  required?: boolean;
  wide?: boolean;
  help?: string;
  section?: string;
};

const shared: Field[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'slug', label: 'URL slug', required: true },
  { key: 'excerpt', label: 'Short description', kind: 'textarea', wide: true },
  { key: 'link', label: 'Destination link', help: 'Use a site path such as /products or an HTTPS URL.' },
  { key: 'sortOrder', label: 'Display order', kind: 'number', help: 'Lower numbers display first.' },
  { key: 'published', label: 'Published on website', kind: 'checkbox' },
];

const fieldsByType: Record<ContentType, Field[]> = {
  HERO: [
    ...shared,
    { key: 'image', label: 'Desktop image / video poster', kind: 'image', wide: true, section: 'Desktop view' },
    { key: 'videoUrl', label: 'Desktop video', kind: 'video', wide: true, section: 'Desktop view' },
    { key: 'mobileImage', label: 'Mobile image / video poster', kind: 'image', wide: true, section: 'Mobile view' },
    { key: 'mobileVideoUrl', label: 'Mobile video', kind: 'video', wide: true, section: 'Mobile view' },
  ],
  BLOG: [...shared, { key: 'image', label: 'Article cover image', kind: 'image', wide: true }, { key: 'body', label: 'Article content', kind: 'textarea', required: true, wide: true }],
  GALLERY: [...shared, { key: 'image', label: 'Gallery photograph', kind: 'image', required: true, wide: true }],
  VIDEO: [...shared, { key: 'image', label: 'Video thumbnail', kind: 'image', wide: true }, { key: 'videoUrl', label: 'Upload video file', kind: 'video', wide: true }, { key: 'youtubeUrl', label: 'Or YouTube URL', wide: true }],
  OFFER: [...shared, { key: 'image', label: 'Offer artwork', kind: 'image', wide: true }, { key: 'body', label: 'Offer terms and details', kind: 'textarea', wide: true }],
  REVIEW: [...shared, { key: 'rating', label: 'Rating (1–5)', kind: 'number', required: true }, { key: 'image', label: 'Customer photograph', kind: 'image', wide: true }, { key: 'body', label: 'Customer review', kind: 'textarea', required: true, wide: true }],
  SOCIAL: [...shared, { key: 'platform', label: 'Social platform', kind: 'select', options: ['Facebook', 'Instagram', 'YouTube', 'TikTok', 'LinkedIn'] }, { key: 'image', label: 'Post image', kind: 'image', wide: true }, { key: 'body', label: 'Post copy', kind: 'textarea', wide: true }],
  RIDER_PROFILE: [...shared, { key: 'image', label: 'Rider portrait', kind: 'image', required: true, wide: true }, { key: 'body', label: 'Rider biography', kind: 'textarea', wide: true }],
};

const typeNames: Record<ContentType, string> = {
  HERO: 'Hero banner', BLOG: 'Blog article', GALLERY: 'Gallery photo', VIDEO: 'Video', OFFER: 'Offer', REVIEW: 'Customer review', SOCIAL: 'Social post', RIDER_PROFILE: 'Rider profile',
};

function defaults(type: ContentType, target: HeroTarget, media: HeroMedia) {
  return {
    type, title: '', slug: '', excerpt: '', body: '', image: '', mobileImage: '', videoUrl: '', mobileVideoUrl: '', youtubeUrl: '', link: '',
    sortOrder: 0, published: false, rating: 5, platform: 'Facebook',
    _focus: type === 'HERO' ? `${target}-${media}` : '',
  };
}

export function ContentManager() {
  const [type, setType] = useState<ContentType>('HERO');
  const [heroTarget, setHeroTarget] = useState<HeroTarget>('desktop');
  const [heroMedia, setHeroMedia] = useState<HeroMedia>('image');
  const [items, setItems] = useState<Entity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [creating, setCreating] = useState<ContentType | null>(null);
  const [deleting, setDeleting] = useState<Entity | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setBusy(true);
    const hero = type === 'HERO' ? `&heroTarget=${heroTarget}&heroMedia=${heroMedia}` : '';
    api<{ items: Entity[]; total: number }>(`/api/admin/content?type=${type}&q=${encodeURIComponent(query)}&page=${page}&pageSize=12${hero}`)
      .then(data => { if (active) { setItems(data.items); setTotal(data.total); } })
      .catch(reason => { if (active) setError(reason.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [type, heroTarget, heroMedia, query, page, version]);

  function selectType(next: ContentType) {
    setType(next);
    setPage(1);
    setSearch('');
    setNotice('');
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/content/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      setNotice('Content deleted.');
      setVersion(value => value + 1);
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  const pageCount = Math.max(1, Math.ceil(total / 12));
  return <>
    <div className="dash-page-heading">
      <div><span className="dash-eyebrow">CONTENT STUDIO</span><h1>Website content.</h1><p>Choose a module below to manage and add its content.</p></div>
    </div>
    {error && <p className="dash-error" role="alert">{error}</p>}
    {notice && <p className="dash-success" role="status"><Check size={17} />{notice}</p>}

    <div className="dash-tabs" aria-label="Content modules">
      {contentTypes.map(value => <button key={value} className={type === value ? 'active' : ''} onClick={() => selectType(value)}>{typeNames[value]}</button>)}
    </div>

    {type === 'HERO' && <section className="dash-panel dash-hero-manager">
      <div className="dash-panel-heading"><div><h2>Hero content management</h2><p>Desktop and mobile have independent image and video playlists.</p></div><Images size={22} /></div>
      <div className="dash-hero-switches">
        <div className="dash-tabs" aria-label="Hero viewport">{(['desktop', 'mobile'] as const).map(value => <button key={value} className={heroTarget === value ? 'active' : ''} onClick={() => { setHeroTarget(value); setPage(1); }}>{value === 'desktop' ? 'Desktop view' : 'Mobile view'}</button>)}</div>
        <div className="dash-tabs" aria-label="Hero media type">{(['image', 'video'] as const).map(value => <button key={value} className={heroMedia === value ? 'active' : ''} onClick={() => { setHeroMedia(value); setPage(1); }}>{value === 'image' ? <><Images size={15} /> Images</> : <><Play size={15} /> Videos</>}</button>)}</div>
      </div>
    </section>}

    <section className="dash-panel">
      <div className="dash-toolbar">
        <label className="dash-search"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${typeNames[type].toLowerCase()}...`} /></label>
        <div className="dash-module-actions"><span className="dash-muted">{total} item{total === 1 ? '' : 's'}</span><button className="dash-button" onClick={() => setCreating(type)}><Plus size={17} />{type === 'HERO' ? `Add ${heroTarget} ${heroMedia}` : `Add ${typeNames[type].toLowerCase()}`}</button></div>
      </div>
      {busy ? <div className="dash-empty">Loading content...</div> : items.length ? <div className="dash-content-cards">
        {items.map(item => <ContentCard key={item.id} item={item} heroTarget={heroTarget} heroMedia={heroMedia} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />)}
      </div> : <div className="dash-empty"><FileText size={34} /><h3>No matching content.</h3><p>Add the first item for this module.</p><button className="dash-button secondary" onClick={() => setCreating(type)}>Add {typeNames[type].toLowerCase()}</button></div>}
      <div className="dash-pagination"><span>Page {page} of {pageCount}</span><div><button className="dash-icon-button" aria-label="Previous page" disabled={page === 1 || busy} onClick={() => setPage(value => value - 1)}><ChevronLeft size={18} /></button><button className="dash-icon-button" aria-label="Next page" disabled={page >= pageCount || busy} onClick={() => setPage(value => value + 1)}><ChevronRight size={18} /></button></div></div>
    </section>

    {(editing || creating) && <ContentEditor type={(editing?.type as ContentType) || creating!} item={editing} initial={defaults(creating || type, heroTarget, heroMedia)} onClose={() => { setEditing(null); setCreating(null); }} onSaved={() => { setEditing(null); setCreating(null); setNotice('Content saved successfully.'); setVersion(value => value + 1); }} />}
    {deleting && <div className="dash-modal-backdrop"><section className="dash-confirm" role="dialog" aria-modal="true"><h2>Delete this content?</h2><p>This removes it from the website and cannot be undone.</p><div className="dash-modal-actions"><button className="dash-button secondary" onClick={() => setDeleting(null)}>Keep content</button><button className="dash-button" onClick={remove}>Delete content</button></div></section></div>}
  </>;
}

function ContentCard({ item, heroTarget, heroMedia, onEdit, onDelete }: { item: Entity; heroTarget: HeroTarget; heroMedia: HeroMedia; onEdit: () => void; onDelete: () => void }) {
  const type = item.type as ContentType;
  const media = type === 'HERO'
    ? heroTarget === 'mobile' ? heroMedia === 'video' ? item.mobileVideoUrl : item.mobileImage : heroMedia === 'video' ? item.videoUrl : item.image
    : item.image || item.videoUrl;
  const isVideo = (type === 'HERO' && heroMedia === 'video') || type === 'VIDEO';
  return <article className="dash-content-card">
    <div className="dash-content-preview">{media ? isVideo ? <video src={String(media)} muted controls preload="metadata" /> : <img src={String(media)} alt="" /> : <FileText size={30} />}</div>
    <div className="dash-content-card-copy"><span className="dash-eyebrow">{typeNames[type]}</span><h3>{String(item.title)}</h3><p>{String(item.excerpt || item.slug || '')}</p><div><span className={`dash-badge ${item.published ? 'delivered' : 'cancelled'}`}>{item.published ? 'Published' : 'Draft'}</span><small>{dateLabel(String(item.updatedAt || item.createdAt || ''))}</small></div></div>
    <div className="dash-row-actions"><button className="dash-icon-button" aria-label="Edit content" onClick={onEdit}><Pencil size={16} /></button><button className="dash-icon-button danger" aria-label="Delete content" onClick={onDelete}><Trash2 size={16} /></button></div>
  </article>;
}

function ContentEditor({ type, item, initial, onClose, onSaved }: { type: ContentType; item: Entity | null; initial: Record<string, unknown>; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({ ...initial, ...item, type });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const fields = fieldsByType[type];

  useEffect(() => { dialog.current?.focus(); }, []);
  function change(key: string, value: unknown) {
    setValues(current => {
      const next = { ...current, [key]: value };
      if (key === 'title' && !item && !current.slug) next.slug = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return next;
    });
  }
  async function upload(file: File | undefined, field: string) {
    if (!file) return;
    setUploading(field); setError('');
    try { const body = new FormData(); body.append('file', file); const result = await api<{ url: string }>('/api/admin/upload', { method: 'POST', body }); change(field, result.url); }
    catch (reason) { setError((reason as Error).message); }
    finally { setUploading(''); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload: Record<string, unknown> = { type };
      for (const field of fields) {
        const value = values[field.key];
        payload[field.key] = field.kind === 'number' ? Number(value || 0) : ['image', 'mobileImage', 'videoUrl', 'mobileVideoUrl', 'youtubeUrl', 'link', 'excerpt', 'body'].includes(field.key) ? value || null : value;
      }
      if (type !== 'REVIEW') payload.rating = null;
      if (type !== 'SOCIAL') payload.platform = null;
      await api(`/api/admin/content${item ? `/${item.id}` : ''}`, { method: item ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  let section = '';
  return <div className="dash-modal-backdrop"><div className="dash-modal" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true"><div className="dash-modal-heading"><div><span className="dash-eyebrow">{item ? 'EDIT' : 'ADD'} {typeNames[type].toUpperCase()}</span><h2>{typeNames[type]} editor</h2></div><button className="dash-icon-button" disabled={busy || Boolean(uploading)} onClick={onClose}><X size={20} /></button></div><form onSubmit={submit}><div className="dash-form-grid">{fields.map(field => {
    const heading = field.section && field.section !== section ? (section = field.section) : '';
    return <div className={field.wide ? 'wide' : ''} key={field.key}>{heading && <h3 className="dash-form-section">{heading}</h3>}<label className={`dash-field ${field.kind === 'checkbox' ? 'dash-checkbox' : ''}`}>{field.kind === 'checkbox' ? <><input type="checkbox" checked={Boolean(values[field.key])} onChange={event => change(field.key, event.target.checked)} />{field.label}</> : <>{field.label}{field.required && <span className="dash-required">*</span>}{field.kind === 'textarea' ? <textarea rows={field.key === 'body' ? 10 : 4} value={String(values[field.key] || '')} required={field.required} onChange={event => change(field.key, event.target.value)} /> : field.kind === 'select' ? <select value={String(values[field.key] || '')} onChange={event => change(field.key, event.target.value)}>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : field.kind === 'image' || field.kind === 'video' ? <div className="dash-image-field">{Boolean(values[field.key]) && (field.kind === 'video' ? <video src={String(values[field.key])} controls muted /> : <img src={String(values[field.key])} alt="Preview" />)}<input value={String(values[field.key] || '')} onChange={event => change(field.key, event.target.value)} placeholder={`Upload or enter ${field.kind} URL`} /><span className="dash-upload"><ImagePlus size={17} />{uploading === field.key ? 'Uploading...' : `Choose ${field.kind}`}<input type="file" accept={field.kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif'} disabled={Boolean(uploading)} onChange={event => upload(event.target.files?.[0], field.key)} /></span></div> : <input type={field.kind === 'number' ? 'number' : 'text'} min={field.key === 'rating' ? 1 : 0} max={field.key === 'rating' ? 5 : undefined} value={String(values[field.key] ?? '')} required={field.required} onChange={event => change(field.key, event.target.value)} />}{field.help && <small>{field.help}</small>}</>}</label></div>;
  })}</div>{error && <p className="dash-error" role="alert">{error}</p>}<div className="dash-modal-actions"><button type="button" className="dash-button secondary" disabled={busy || Boolean(uploading)} onClick={onClose}>Cancel</button><button className="dash-button" disabled={busy || Boolean(uploading)}><Check size={17} />{busy ? 'Saving...' : 'Save changes'}</button></div></form></div></div>;
}
