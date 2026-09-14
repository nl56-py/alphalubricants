import type { NextConfig } from 'next';
const isDev = process.env.NODE_ENV === 'development';
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests"
].join('; ');
const config: NextConfig = {
  output: 'standalone', poweredByHeader: false, devIndicators: false,
  images: { formats: ['image/avif','image/webp'], minimumCacheTTL: 86400, remotePatterns: [{protocol:'https',hostname:'i.ytimg.com'}] },
  async headers() { return [{ source: '/(.*)', headers: [
    {key:'Content-Security-Policy',value:csp},
    {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains; preload'},
    {key:'X-Content-Type-Options',value:'nosniff'}, {key:'X-Frame-Options',value:'SAMEORIGIN'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}, {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=()'},
    {key:'X-DNS-Prefetch-Control',value:'on'}, {key:'X-Permitted-Cross-Domain-Policies',value:'none'},
    {key:'Cross-Origin-Opener-Policy',value:'same-origin'}, {key:'Cross-Origin-Resource-Policy',value:'same-site'}
  ] }, {source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'}]}, {source:'/images/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]}]; }
};
export default config;
