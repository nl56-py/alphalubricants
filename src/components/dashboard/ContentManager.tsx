'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, FileText, ImagePlus, Images, ListOrdered, Monitor, Pencil, Play, Plus, Search, Smartphone, Trash2, X } from 'lucide-react';
import { api, dateLabel } from './session';
import type { Entity } from './types';

const contentTypes = ['HERO', 'BLOG', 'GALLERY', 'VIDEO', 'OFFER', 'REVIEW', 'SOCIAL'] as const;
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
};

const typeNames: Record<ContentType, string> = {
  HERO: 'Hero banner', BLOG: 'Blog article', GALLERY: 'Gallery photo', VIDEO: 'Video', OFFER: 'Offer', REVIEW: 'Customer review', SOCIAL: 'Social post',
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
  const [heroMode, setHeroMode] = useState<'manage' | 'order'>('manage');
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

    {type === 'HERO' && (
      <div className="dash-tabs" style={{ marginBottom: '1.25rem' }} aria-label="Hero management mode">
        <button className={heroMode === 'manage' ? 'active' : ''} onClick={() => setHeroMode('manage')}>
          <Images size={15} /> Add &amp; Manage Media
        </button>
        <button className={heroMode === 'order' ? 'active' : ''} onClick={() => setHeroMode('order')}>
          <ListOrdered size={15} /> Set Hero Order (Images &amp; Videos)
        </button>
      </div>
    )}

    {type === 'HERO' && heroMode === 'order' ? (
      <HeroOrderManager onSaved={() => setVersion(value => value + 1)} />
    ) : (
      <>
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
      </>
    )}

    {(editing || creating) && (
      <ContentEditor
        type={(editing?.type as ContentType) || creating!}
        item={editing}
        initial={defaults(creating || type, heroTarget, heroMedia)}
        initialHeroTarget={heroTarget}
        onClose={() => { setEditing(null); setCreating(null); }}
        onSaved={() => { setEditing(null); setCreating(null); setNotice('Content saved successfully.'); setVersion(value => value + 1); }}
      />
    )}
    {deleting && <div className="dash-modal-backdrop"><section className="dash-confirm" role="dialog" aria-modal="true"><h2>Delete this content?</h2><p>This removes it from the website and cannot be undone.</p><div className="dash-modal-actions"><button className="dash-button secondary" onClick={() => setDeleting(null)}>Keep content</button><button className="dash-button" onClick={remove}>Delete content</button></div></section></div>}
  </>;
}

function HeroOrderManager({ onSaved }: { onSaved: () => void }) {
  const [orderTarget, setOrderTarget] = useState<'desktop' | 'mobile'>('desktop');
  const [allItems, setAllItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<{ items: Entity[] }>('/api/admin/content?type=HERO&pageSize=100')
      .then(data => {
        if (active) {
          const sorted = [...(data.items || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
          setAllItems(sorted);
        }
      })
      .catch(err => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const desktopItems = allItems.filter(item => Boolean(item.image || item.videoUrl || (!item.mobileImage && !item.mobileVideoUrl)));
  const mobileItems = allItems.filter(item => Boolean(item.mobileImage || item.mobileVideoUrl || (!item.image && !item.videoUrl)));
  const currentItems = orderTarget === 'desktop' ? desktopItems : mobileItems;

  function move(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentItems.length) return;
    const nextCurrent = [...currentItems];
    const [moved] = nextCurrent.splice(index, 1);
    nextCurrent.splice(targetIndex, 0, moved);

    const otherItems = allItems.filter(item => !currentItems.some(c => c.id === item.id));
    setAllItems([...nextCurrent, ...otherItems]);
    setDirty(true);
    setSuccess('');
  }

  async function saveOrder() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        items: currentItems.map((item, index) => ({
          id: String(item.id),
          sortOrder: index * 10,
        })),
      };
      await api('/api/admin/content/reorder', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setDirty(false);
      setSuccess(`${orderTarget === 'desktop' ? 'Desktop' : 'Mobile'} hero display order saved and published successfully!`);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dash-panel">
      <div className="dash-panel-heading">
        <div>
          <h2>Hero Display Order Management</h2>
          <p>Organize the sequential display order for hero media. Choose a sub-tab below to set independent order for Desktop and Mobile viewports.</p>
        </div>
        <div className="dash-module-actions">
          {dirty && <span className="dash-badge active">Unsaved Changes</span>}
          <button className="dash-button" disabled={saving || !dirty || currentItems.length === 0} onClick={saveOrder}>
            <Check size={16} /> {saving ? 'Saving...' : `Save ${orderTarget === 'desktop' ? 'Desktop' : 'Mobile'} Order`}
          </button>
        </div>
      </div>

      <div className="dash-tabs" style={{ margin: '0 24px 20px' }} aria-label="Hero order sub-tabs">
        <button
          type="button"
          className={orderTarget === 'desktop' ? 'active' : ''}
          onClick={() => { setOrderTarget('desktop'); setSuccess(''); }}
        >
          <Monitor size={15} /> Desktop View Order ({desktopItems.length})
        </button>
        <button
          type="button"
          className={orderTarget === 'mobile' ? 'active' : ''}
          onClick={() => { setOrderTarget('mobile'); setSuccess(''); }}
        >
          <Smartphone size={15} /> Mobile View Order ({mobileItems.length})
        </button>
      </div>

      {error && <p className="dash-error" role="alert" style={{ margin: '0 24px 16px' }}>{error}</p>}
      {success && <p className="dash-success" role="status" style={{ margin: '0 24px 16px' }}><Check size={17} />{success}</p>}

      {loading ? (
        <div className="dash-empty">Loading {orderTarget} hero media...</div>
      ) : currentItems.length === 0 ? (
        <div className="dash-empty">
          <FileText size={34} />
          <h3>No {orderTarget} hero media found.</h3>
          <p>Add {orderTarget} hero images or videos in the "Add &amp; Manage Media" tab first.</p>
        </div>
      ) : (
        <div className="dash-hero-order-list">
          {currentItems.map((item, index) => {
            const isMobileView = orderTarget === 'mobile';
            const mediaUrl = isMobileView
              ? (item.mobileImage || item.mobileVideoUrl || item.image || item.videoUrl)
              : (item.image || item.videoUrl);
            const isVideo = isMobileView
              ? Boolean(item.mobileVideoUrl) || (!item.mobileImage && Boolean(item.videoUrl))
              : Boolean(item.videoUrl);

            return (
              <div key={item.id} className="dash-hero-order-item">
                <div className="dash-hero-order-position">#{index + 1}</div>
                <div className="dash-hero-order-preview">
                  {mediaUrl ? (
                    isVideo ? (
                      <video src={String(mediaUrl)} muted preload="metadata" />
                    ) : (
                      <img src={String(mediaUrl)} alt="" />
                    )
                  ) : (
                    <FileText size={24} />
                  )}
                </div>
                <div className="dash-hero-order-info">
                  <strong>{String(item.title || 'Untitled Hero Slide')}</strong>
                  <p>{String(item.excerpt || item.slug || 'No description')}</p>
                  <div className="dash-hero-order-badges">
                    {isMobileView ? (
                      item.mobileVideoUrl ? (
                        <span className="dash-badge processing">Mobile Video</span>
                      ) : (
                        <span className="dash-badge delivered">Mobile Image</span>
                      )
                    ) : (
                      item.videoUrl ? (
                        <span className="dash-badge processing">Desktop Video</span>
                      ) : (
                        <span className="dash-badge delivered">Desktop Image</span>
                      )
                    )}
                    <span className={`dash-badge ${item.published ? 'delivered' : 'cancelled'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                    <span className="dash-badge info">Sequence: #{index + 1}</span>
                  </div>
                </div>
                <div className="dash-hero-order-controls">
                  <button
                    type="button"
                    className="dash-icon-button"
                    aria-label="Move item up"
                    disabled={index === 0 || saving}
                    onClick={() => move(index, 'up')}
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="dash-icon-button"
                    aria-label="Move item down"
                    disabled={index === currentItems.length - 1 || saving}
                    onClick={() => move(index, 'down')}
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ContentCard({ item, heroTarget, heroMedia, onEdit, onDelete }: { item: Entity; heroTarget: HeroTarget; heroMedia: HeroMedia; onEdit: () => void; onDelete: () => void }) {
  const type = item.type as ContentType;
  const media = type === 'HERO'
    ? heroTarget === 'mobile' ? (item.mobileVideoUrl || item.mobileImage || item.image) : (item.videoUrl || item.image)
    : item.image || item.videoUrl;
  const isVideo = type === 'HERO'
    ? (heroTarget === 'mobile' ? Boolean(item.mobileVideoUrl) : Boolean(item.videoUrl))
    : type === 'VIDEO';
  return <article className="dash-content-card">
    <div className="dash-content-preview">{media ? isVideo ? <video src={String(media)} muted controls preload="metadata" /> : <img src={String(media)} alt="" /> : <FileText size={30} />}</div>
    <div className="dash-content-card-copy"><span className="dash-eyebrow">{type === 'HERO' ? (heroTarget === 'mobile' ? 'Mobile Hero' : 'Desktop Hero') : typeNames[type]}</span><h3>{String(item.title)}</h3><p>{String(item.excerpt || item.slug || '')}</p><div><span className={`dash-badge ${item.published ? 'delivered' : 'cancelled'}`}>{item.published ? 'Published' : 'Draft'}</span><small>{dateLabel(String(item.updatedAt || item.createdAt || ''))}</small></div></div>
    <div className="dash-row-actions"><button className="dash-icon-button" aria-label="Edit content" onClick={onEdit}><Pencil size={16} /></button><button className="dash-icon-button danger" aria-label="Delete content" onClick={onDelete}><Trash2 size={16} /></button></div>
  </article>;
}

function ContentEditor({
  type,
  item,
  initial,
  initialHeroTarget = 'desktop',
  onClose,
  onSaved,
}: {
  type: ContentType;
  item: Entity | null;
  initial: Record<string, unknown>;
  initialHeroTarget?: HeroTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({ ...initial, ...item, type });
  const [editorTarget, setEditorTarget] = useState<'desktop' | 'mobile' | 'both'>(
    type === 'HERO' ? (initialHeroTarget === 'mobile' ? 'mobile' : 'desktop') : 'both'
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const allFields = fieldsByType[type];

  // Filter fields when type === 'HERO' to provide individual mobile or desktop management
  const fields = allFields.filter(f => {
    if (type !== 'HERO') return true;
    if (editorTarget === 'mobile') {
      return f.key !== 'image' && f.key !== 'videoUrl';
    }
    if (editorTarget === 'desktop') {
      return f.key !== 'mobileImage' && f.key !== 'mobileVideoUrl';
    }
    return true;
  });

  useEffect(() => { dialog.current?.focus(); }, []);

  function formatGoogleDriveUrl(url: string, field: string): string {
    const match = url.match(/(?:file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]{25,})/);
    if (!match) return url;
    const fileId = match[1];
    if (field === 'image' || field === 'mobileImage') {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
  }

  function change(key: string, value: unknown) {
    let val = value;
    if (typeof val === 'string' && ['image', 'mobileImage', 'videoUrl', 'mobileVideoUrl'].includes(key)) {
      val = formatGoogleDriveUrl(val, key);
    }
    setValues(current => {
      const next = { ...current, [key]: val };
      if (key === 'title' && !item && !current.slug) {
        next.slug = String(val).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
  }

  async function upload(file: File | undefined, field: string) {
    if (!file) return;
    setUploading(field);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const result = await api<{ url: string }>('/api/admin/upload', { method: 'POST', body });
      change(field, result.url);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setUploading('');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { type };
      for (const field of allFields) {
        const value = values[field.key];
        payload[field.key] = field.kind === 'number'
          ? Number(value || 0)
          : ['image', 'mobileImage', 'videoUrl', 'mobileVideoUrl', 'youtubeUrl', 'link', 'excerpt', 'body'].includes(field.key)
          ? value || null
          : value;
      }
      if (type !== 'REVIEW') payload.rating = null;
      if (type !== 'SOCIAL') payload.platform = null;
      await api(`/api/admin/content${item ? `/${item.id}` : ''}`, { method: item ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  let section = '';
  return (
    <div className="dash-modal-backdrop">
      <div className="dash-modal" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="dash-modal-heading">
          <div>
            <span className="dash-eyebrow">{item ? 'EDIT' : 'ADD'} {typeNames[type].toUpperCase()}</span>
            <h2>{type === 'HERO' ? (editorTarget === 'mobile' ? 'Mobile Hero Media (Individual)' : editorTarget === 'desktop' ? 'Desktop Hero Media (Individual)' : 'Hero Banner Editor') : `${typeNames[type]} editor`}</h2>
          </div>
          <button className="dash-icon-button" disabled={busy || Boolean(uploading)} onClick={onClose} aria-label="Close editor">
            <X size={20} />
          </button>
        </div>

        {type === 'HERO' && (
          <div className="dash-tabs" style={{ margin: '0 0 18px' }} aria-label="Hero media viewport scope">
            <button
              type="button"
              className={editorTarget === 'mobile' ? 'active' : ''}
              onClick={() => setEditorTarget('mobile')}
            >
              <Smartphone size={14} /> Mobile Media (Individual)
            </button>
            <button
              type="button"
              className={editorTarget === 'desktop' ? 'active' : ''}
              onClick={() => setEditorTarget('desktop')}
            >
              <Monitor size={14} /> Desktop Media (Individual)
            </button>
            <button
              type="button"
              className={editorTarget === 'both' ? 'active' : ''}
              onClick={() => setEditorTarget('both')}
            >
              Combined (Both)
            </button>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="dash-form-grid">
            {fields.map(field => {
              const heading = field.section && field.section !== section ? (section = field.section) : '';
              const val = String(values[field.key] || '');
              const isDriveVideo = (field.kind === 'video') && val.includes('drive.google.com');

              return (
                <div className={field.wide ? 'wide' : ''} key={field.key}>
                  {heading && editorTarget === 'both' && <h3 className="dash-form-section">{heading}</h3>}
                  <label className={`dash-field ${field.kind === 'checkbox' ? 'dash-checkbox' : ''}`}>
                    {field.kind === 'checkbox' ? (
                      <>
                        <input type="checkbox" checked={Boolean(values[field.key])} onChange={event => change(field.key, event.target.checked)} />
                        {field.label}
                      </>
                    ) : (
                      <>
                        {field.label}
                        {field.required && <span className="dash-required">*</span>}
                        {field.kind === 'textarea' ? (
                          <textarea rows={field.key === 'body' ? 10 : 4} value={val} required={field.required} onChange={event => change(field.key, event.target.value)} />
                        ) : field.kind === 'select' ? (
                          <select value={val} onChange={event => change(field.key, event.target.value)}>
                            {field.options?.map(option => <option key={option}>{option}</option>)}
                          </select>
                        ) : field.kind === 'image' || field.kind === 'video' ? (
                          <div className="dash-image-field">
                            {Boolean(values[field.key]) && (
                              field.kind === 'video' ? (
                                <video src={val} controls muted style={{ maxWidth: '100%', maxHeight: '180px' }} />
                              ) : (
                                <img src={val} alt="Preview" />
                              )
                            )}
                            <input
                              value={val}
                              onChange={event => change(field.key, event.target.value)}
                              placeholder={`Upload (up to 500MB) or enter HTTPS ${field.kind} URL`}
                            />
                            <span className="dash-upload">
                              <ImagePlus size={17} />
                              {uploading === field.key ? 'Uploading (up to 500MB)...' : `Choose ${field.kind} (up to 500MB)`}
                              <input
                                type="file"
                                accept={field.kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif'}
                                disabled={Boolean(uploading)}
                                onChange={event => upload(event.target.files?.[0], field.key)}
                              />
                            </span>
                            {isDriveVideo && (
                              <div style={{ marginTop: '8px', fontSize: '11px', color: '#8a4b08', background: '#fffaf0', border: '1px solid #fed7aa', borderRadius: '6px', padding: '8px 10px', lineHeight: '1.5' }}>
                                ⚠️ <strong>Google Drive Video Notice:</strong> Google Drive sharing links cannot stream video in web players due to Google&apos;s Cross-Origin Policy and virus scan restrictions. Please use the <strong>&quot;Choose video&quot;</strong> button above to upload the MP4/WebM file directly (up to <strong>500 MB</strong> supported).
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            type={field.kind === 'number' ? 'number' : 'text'}
                            min={field.key === 'rating' ? 1 : 0}
                            max={field.key === 'rating' ? 5 : undefined}
                            value={String(values[field.key] ?? '')}
                            required={field.required}
                            onChange={event => change(field.key, event.target.value)}
                          />
                        )}
                        {field.help && <small>{field.help}</small>}
                      </>
                    )}
                  </label>
                </div>
              );
            })}
          </div>

          {error && <p className="dash-error" role="alert">{error}</p>}
          <div className="dash-modal-actions">
            <button type="button" className="dash-button secondary" disabled={busy || Boolean(uploading)} onClick={onClose}>
              Cancel
            </button>
            <button className="dash-button" disabled={busy || Boolean(uploading)}>
              <Check size={17} />
              {busy ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
