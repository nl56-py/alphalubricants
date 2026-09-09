'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export type HeroSlide = {
  id: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  mobileImage?: string | null;
  link: string | null;
  videoUrl?: string | null;
  mobileVideoUrl?: string | null;
};

type PlaylistItem = HeroSlide & {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  poster: string | null;
};

function playlistFor(slides: HeroSlide[], mobile: boolean): PlaylistItem[] {
  return slides.flatMap<PlaylistItem>(slide => {
    const video = mobile ? slide.mobileVideoUrl || slide.videoUrl : slide.videoUrl;
    const image = mobile ? slide.mobileImage || slide.image : slide.image;
    if (video) return [{ ...slide, mediaType: 'video' as const, mediaUrl: video, poster: image || null }];
    if (image) return [{ ...slide, mediaType: 'image' as const, mediaUrl: image, poster: image }];
    return [];
  });
}

function BackgroundVideo({ src, poster, playing, onEnded, loop }: {
  src: string;
  poster?: string;
  playing: boolean;
  onEnded: () => void;
  loop: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) void video.play().catch(() => {});
    else video.pause();
  }, [playing]);

  if (failed) return null;
  return (
    <video
      ref={ref}
      className="hero-video"
      poster={poster}
      muted
      playsInline
      autoPlay
      loop={loop}
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      onError={() => {
        setFailed(true);
        onEnded();
      }}
      onEnded={onEnded}
    >
      <source src={src} type={src.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4'} />
    </video>
  );
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const desktopPlaylist = useMemo(() => playlistFor(slides, false), [slides]);
  const mobilePlaylist = useMemo(() => playlistFor(slides, true), [slides]);
  const data = mobile ? mobilePlaylist : desktopPlaylist;

  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 600px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateViewport = () => setMobile(viewport.matches);
    const updateMotion = () => setReduceMotion(motion.matches);
    updateViewport();
    updateMotion();
    viewport.addEventListener('change', updateViewport);
    motion.addEventListener('change', updateMotion);
    return () => {
      viewport.removeEventListener('change', updateViewport);
      motion.removeEventListener('change', updateMotion);
    };
  }, []);

  useEffect(() => setActive(0), [mobile]);

  const current = data[active % Math.max(data.length, 1)];
  const hasVideo = current?.mediaType === 'video' && !reduceMotion;

  useEffect(() => {
    if (paused || data.length < 2 || hasVideo) return;
    const timer = setTimeout(() => setActive(value => (value + 1) % data.length), 4000);
    return () => clearTimeout(timer);
  }, [active, paused, data.length, hasVideo]);

  useEffect(() => {
    if (paused || data.length < 2 || !hasVideo) return;
    const timer = setTimeout(() => setActive(value => (value + 1) % data.length), 90000);
    return () => clearTimeout(timer);
  }, [active, paused, data.length, hasVideo]);

  if (!current) return null;
  const words = current.title.trim().split(/\s+/);
  const split = words.length > 3 ? words.length - 2 : words.length;
  const next = () => setActive(value => (value + 1) % data.length);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Alpha highlights">
      <div className="hero-slides">
        {data.map((slide, index) => (
          <div className={`hero-slide ${index === active ? 'is-active' : ''}`} aria-hidden={index !== active} key={`${mobile ? 'mobile' : 'desktop'}-${slide.id}`}>
            {slide.mediaType === 'image' || reduceMotion ? (
              slide.poster && <Image src={slide.poster} alt="" fill priority={index === 0} sizes="100vw" className="hero-photo" unoptimized={slide.poster.startsWith('https://')} />
            ) : index === active ? (
              <BackgroundVideo src={slide.mediaUrl} poster={slide.poster || undefined} playing={!paused} loop={data.length === 1} onEnded={next} />
            ) : slide.poster ? (
              <Image src={slide.poster} alt="" fill sizes="100vw" className="hero-photo" unoptimized={slide.poster.startsWith('https://')} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content wrap" key={current.id}>
        <p className="eyebrow light">ALPHA LUBRICANTS • NEPAL</p>
        <h1>
          {words.slice(0, split).join(' ')}
          {split < words.length && <><br /><span>{words.slice(split).join(' ')}</span></>}
        </h1>
        {mobile ? <>
          {current.link && <Link href={current.link} className="button white-button">Explore our products <ArrowUpRight size={18} /></Link>}
          {current.excerpt && <p className="hero-description">{current.excerpt}</p>}
        </> : <>
          {current.excerpt && <p className="hero-description">{current.excerpt}</p>}
          {current.link && <Link href={current.link} className="button white-button">Explore our products <ArrowUpRight size={18} /></Link>}
        </>}
      </div>
      <div className="hero-bottom wrap">
        <div className="hero-dots" aria-label="Choose a highlight">
          {data.map((slide, index) => <button key={slide.id} onClick={() => setActive(index)} aria-label={`Go to slide ${index + 1}: ${slide.title}`} aria-current={index === active} className={index === active ? 'selected' : ''}><span /></button>)}
          {(data.length > 1 || hasVideo) && <button className="pause" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play hero' : 'Pause hero'}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
        </div>
        <a href="#our-products" className="hero-scroll" aria-label="Explore our product catalogue"><ArrowDown size={29} /></a>
        <div className="hero-navigation">
          <button onClick={() => setActive((active + data.length - 1) % data.length)} aria-label="Previous slide"><ChevronLeft size={20} /></button>
          <span className="hero-count">{String(active + 1).padStart(2, '0')} <span>/ {String(data.length).padStart(2, '0')}</span></span>
          <button onClick={next} aria-label="Next slide"><ChevronRight size={20} /></button>
        </div>
      </div>
    </section>
  );
}
