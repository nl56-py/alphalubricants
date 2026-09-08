'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
export type HeroSlide={id:string;title:string;excerpt:string|null;image:string|null;link:string|null;videoUrl?:string|null};
function BackgroundVideo({src,poster,playing}:{src:string;poster?:string;playing:boolean}){
  const ref=useRef<HTMLVideoElement>(null);const [failed,setFailed]=useState(false);
  useEffect(()=>{const video=ref.current;if(!video)return;if(playing)void video.play().catch(()=>{});else video.pause()},[playing]);
  if(failed)return null;
  return <video ref={ref} className="hero-video" src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} onError={()=>setFailed(true)}/>;
}
export function Hero({slides}:{slides:HeroSlide[]}){
  const data=slides.length?slides:[{id:'default',title:'Engineered for your journey.',excerpt:'Performance. Protection. Power.',image:'/images/alpha-racing.webp',link:'/products'}];
  const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[reduceMotion,setReduceMotion]=useState(false);
  useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');setReduceMotion(query.matches);const change=()=>setReduceMotion(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change)},[]);
  useEffect(()=>{if(paused||hovered||focused||reduceMotion||data.length<2)return;const timer=setInterval(()=>setActive(v=>(v+1)%data.length),7000);return()=>clearInterval(timer)},[paused,hovered,focused,reduceMotion,data.length]);
  const current=data[active%data.length];const words=current.title.trim().split(/\s+/);const split=words.length>3?words.length-2:words.length;
  const hasVideo=Boolean(current.videoUrl);
  return <section className="hero" aria-roledescription="carousel" aria-label="Alpha highlights" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}}>
    <div className="hero-slides">{data.map((slide,i)=><div className={`hero-slide ${i===active?'is-active':''}`} aria-hidden="true" key={slide.id}>
      <Image src={slide.image||'/images/alpha-racing.webp'} alt="" fill sizes="65vw" className="hero-ambient" unoptimized={Boolean(slide.image?.startsWith('https://'))}/>
      <Image src={slide.image||'/images/alpha-racing.webp'} alt="" fill priority={i===0} sizes="100vw" className="hero-photo" unoptimized={Boolean(slide.image?.startsWith('https://'))}/>
      {slide.videoUrl&&i===active&&!reduceMotion&&<BackgroundVideo src={slide.videoUrl} poster={slide.image||undefined} playing={!paused}/>}
    </div>)}</div>
    <div className="hero-content wrap" key={current.id}>
      <p className="eyebrow light">ALPHA LUBRICANTS • NEPAL</p>
      <h1>{words.slice(0,split).join(' ')}{split<words.length&&<><br/><span>{words.slice(split).join(' ')}</span></>}</h1>
      <p className="hero-description">{current.excerpt}</p>
      <Link href="#our-products" className="button white-button">Explore our products <ArrowUpRight size={18}/></Link>
    </div>
    <div className="hero-bottom wrap"><div className="hero-dots" aria-label="Choose a highlight">{data.map((slide,i)=><button key={slide.id} onClick={()=>setActive(i)} aria-label={`Go to slide ${i+1}: ${slide.title}`} aria-current={i===active} className={i===active?'selected':''}><span/></button>)}{(data.length>1||hasVideo)&&<button className="pause" onClick={()=>setPaused(!paused)} aria-label={paused?'Play hero':'Pause hero'}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>}</div><a href="#our-products" className="hero-scroll" aria-label="Explore our product catalogue"><ArrowDown size={29}/></a><div className="hero-navigation"><button onClick={()=>setActive((active+data.length-1)%data.length)} aria-label="Previous slide"><ChevronLeft size={20}/></button><span className="hero-count">{String(active+1).padStart(2,'0')} <span>/ {String(data.length).padStart(2,'0')}</span></span><button onClick={()=>setActive((active+1)%data.length)} aria-label="Next slide"><ChevronRight size={20}/></button></div></div>
  </section>;
}
