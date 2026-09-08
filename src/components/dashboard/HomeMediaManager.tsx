'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Check, ImagePlus, Layout, Save } from 'lucide-react';
import { api } from './session';
import type { HomeMediaSettings } from '@/lib/server/catalog';

type MediaField = {
  key: keyof HomeMediaSettings;
  label: string;
  section: string;
  hint: string;
};

const mediaFields: MediaField[] = [
  { key: 'performanceImage', label: 'Performance section image', section: 'Performance & Power Section', hint: 'Widescreen banner image showing on-road performance (recommended: 1920x800 webp/jpg).' },
  { key: 'partnershipImage', label: 'Riders & community banner image', section: 'Riders & Community Section', hint: 'Side-by-side photo representing the official riders (recommended: 1200x900).' },
  { key: 'categoryMotorcycleImage', label: 'Category: Motorcycle card', section: 'Product Categories', hint: 'Card image for street/motorcycle lubricants (recommended: 800x600).' },
  { key: 'categoryOffroadImage', label: 'Category: Off-road card', section: 'Product Categories', hint: 'Card image for adventure and dirt motorcycle oils (recommended: 800x600).' },
  { key: 'categoryTrackImage', label: 'Category: Track & Racing card', section: 'Product Categories', hint: 'Card image for high-RPM circuit racing and sport lubricants (recommended: 800x600).' },
  { key: 'heritagePerformanceImage', label: 'Heritage principle: Performance', section: 'The Alpha Way (Heritage)', hint: 'Principle 1 tab photo (recommended: 900x550).' },
  { key: 'heritageProtectionImage', label: 'Heritage principle: Protection', section: 'The Alpha Way (Heritage)', hint: 'Principle 2 tab photo (recommended: 900x550).' },
  { key: 'heritagePowerImage', label: 'Heritage principle: Power', section: 'The Alpha Way (Heritage)', hint: 'Principle 3 tab photo (recommended: 900x550).' },
  { key: 'dealershipBannerImage', label: 'Dealership page banner', section: 'Dealership Network Page', hint: 'Hero banner photo for the /dealership partner page (recommended: 1920x600).' },
];

export function HomeMediaManager() {
  const [media, setMedia] = useState<HomeMediaSettings | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    api<{ homeMedia: HomeMediaSettings }>('/api/admin/home-media')
      .then(d => setMedia(d.homeMedia))
      .catch(e => setError(e.message));
  }, []);

  function change(key: keyof HomeMediaSettings, value: string) {
    setMedia(m => (m ? { ...m, [key]: value } : null));
  }

  async function upload(file: File | undefined, key: keyof HomeMediaSettings) {
    if (!file) return;
    setUploadingKey(key);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await api<{ url: string }>('/api/admin/upload', { method: 'POST', body });
      change(key, data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingKey(null);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!media) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api('/api/admin/home-media', {
        method: 'PUT',
        body: JSON.stringify(media),
      });
      setNotice('Homepage media updated successfully.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const sections = Array.from(new Set(mediaFields.map(f => f.section)));

  return (
    <>
      <div className="dash-page-heading">
        <div>
          <span className="dash-eyebrow">HOMEPAGE CONTENT</span>
          <h1>Home sections media.</h1>
          <p>Customize and update the photos and visuals displayed across different homepage sections.</p>
        </div>
      </div>
      {error && <p className="dash-error" role="alert">{error}</p>}
      {notice && <p className="dash-success" role="status"><Check size={18} />{notice}</p>}
      {media ? (
        <form onSubmit={submit} className="dash-settings">
          {sections.map(sectionName => (
            <section className="dash-panel" key={sectionName}>
              <div className="dash-panel-heading">
                <div>
                  <h2>{sectionName}</h2>
                  <p>Update section media and promotional assets.</p>
                </div>
                <Layout size={22} />
              </div>
              <div className="dash-form-grid">
                {mediaFields
                  .filter(f => f.section === sectionName)
                  .map(f => {
                    const value = media[f.key] || '';
                    const isUploading = uploadingKey === f.key;
                    return (
                      <label className="dash-field wide" key={f.key}>
                        {f.label}
                        <div className="dash-image-field">
                          {Boolean(value) && (
                            <img
                              src={value}
                              alt={f.label}
                              style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 4 }}
                            />
                          )}
                          <input
                            value={value}
                            placeholder="Enter image URL or upload a file"
                            onChange={e => change(f.key, e.target.value)}
                            required
                          />
                          <span className="dash-upload">
                            <ImagePlus size={18} />
                            {isUploading ? 'Uploading...' : 'Choose image'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={isUploading || busy}
                              onChange={e => upload(e.target.files?.[0], f.key)}
                            />
                          </span>
                        </div>
                        <small>{f.hint}</small>
                      </label>
                    );
                  })}
              </div>
            </section>
          ))}
          <button className="dash-button" disabled={busy || Boolean(uploadingKey)}>
            <Save size={17} />
            {busy ? 'Saving...' : 'Save homepage media'}
          </button>
        </form>
      ) : (
        !error && <div className="dash-empty">Loading homepage media settings...</div>
      )}
    </>
  );
}
