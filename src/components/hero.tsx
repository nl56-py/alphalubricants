'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';

export type HeroSlide = {
  id: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  mobileImage?: string | null;
  link: string | null;
  videoUrl?: string | null;
};

function BackgroundVideo({
  src,
  poster,
  playing,
  mobileSrc,
  onEnded,
  loop = false,
}: {
  src: string;
  poster?: string;
  playing: boolean;
  mobileSrc?: string;
  onEnded?: () => void;
  loop?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resolvedMobile = mobileSrc || src.replace('hero desk 1.mp4', 'hero mob 1.mp4').replace('hero desk 2.mp4', 'hero mob 2.mp4');
  const activeSrc = isMobile && resolvedMobile ? resolvedMobile : src;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing]);

  if (failed) return null;

  return (
    <video
      ref={ref}
      key={activeSrc}
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
        onEnded?.();
      }}
      onEnded={onEnded}
    >
      <source src={activeSrc} type="video/mp4" />
    </video>
  );
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const data = slides.length
    ? slides
    : [
        {
          id: 'default',
          title: 'Engineered for your journey.',
          excerpt: 'Performance. Protection. Power.',
          image: '/images/alpha-racing.webp',
          link: '/products',
        },
      ];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const change = () => setReduceMotion(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  const current = data[active % data.length];
  const words = current.title.trim().split(/\s+/);
  const split = words.length > 3 ? words.length - 2 : words.length;
  const hasVideo = Boolean(current.videoUrl) && !reduceMotion;

  // For non-video slides, advance after standard interval (4s)
  useEffect(() => {
    if (paused || data.length < 2 || hasVideo) return;
    const timer = setTimeout(() => {
      setActive(v => (v + 1) % data.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [active, paused, data.length, hasVideo]);

  // Safety fallback for video slides in case autoplay is blocked or stalls
  useEffect(() => {
    if (paused || data.length < 2 || !hasVideo) return;
    const fallbackTimer = setTimeout(() => {
      setActive(v => (v + 1) % data.length);
    }, 90000);
    return () => clearTimeout(fallbackTimer);
  }, [active, paused, data.length, hasVideo]);

  const handleVideoEnded = () => {
    if (!paused && data.length > 1) {
      setActive(v => (v + 1) % data.length);
    }
  };

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Alpha highlights">
      <div className="hero-slides">
        {data.map((slide, i) => {
          const mobileVideo = slide.videoUrl?.includes('hero desk 2.mp4')
            ? '/video/hero mob 2.mp4'
            : slide.videoUrl?.includes('hero desk 1.mp4')
            ? '/video/hero mob 1.mp4'
            : slide.image?.includes('hero 16 9') || slide.mobileImage?.includes('mob hero 1')
            ? '/video/hero mob 2.mp4'
            : '/video/hero mob 1.mp4';

          return (
            <div className={`hero-slide ${i === active ? 'is-active' : ''}`} aria-hidden="true" key={slide.id}>
              <Image
                src={slide.image || '/images/alpha-racing.webp'}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={`hero-photo ${slide.mobileImage ? 'hero-photo-desktop' : ''}`}
                unoptimized={Boolean(slide.image?.startsWith('https://'))}
              />
              {slide.mobileImage && (
                <Image
                  src={slide.mobileImage}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="hero-photo hero-photo-mobile"
                  unoptimized={Boolean(slide.mobileImage.startsWith('https://'))}
                />
              )}
              {slide.videoUrl && i === active && !reduceMotion && (
                <BackgroundVideo
                  src={slide.videoUrl}
                  mobileSrc={mobileVideo}
                  poster={slide.image || undefined}
                  playing={!paused}
                  loop={data.length === 1}
                  onEnded={handleVideoEnded}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content wrap" key={current.id}>
        <p className="eyebrow light">ALPHA LUBRICANTS • NEPAL</p>
        <h1>
          {words.slice(0, split).join(' ')}
          {split < words.length && (
            <>
              <br />
              <span>{words.slice(split).join(' ')}</span>
            </>
          )}
        </h1>
        <p className="hero-description">{current.excerpt}</p>
        <Link href="#our-products" className="button white-button">
          Explore our products <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="hero-bottom wrap">
        <div className="hero-dots" aria-label="Choose a highlight">
          {data.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              aria-current={i === active}
              className={i === active ? 'selected' : ''}
            >
              <span />
            </button>
          ))}
          {(data.length > 1 || hasVideo) && (
            <button
              className="pause"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? 'Play hero' : 'Pause hero'}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}
        </div>
        <a href="#our-products" className="hero-scroll" aria-label="Explore our product catalogue">
          <ArrowDown size={29} />
        </a>
        <div className="hero-navigation">
          <button onClick={() => setActive((active + data.length - 1) % data.length)} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <span className="hero-count">
            {String(active + 1).padStart(2, '0')}{' '}
            <span>/ {String(data.length).padStart(2, '0')}</span>
          </span>
          <button onClick={() => setActive((active + 1) % data.length)} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
