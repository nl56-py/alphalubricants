import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone', poweredByHeader: false, devIndicators: false,
  images: { formats: ['image/avif','image/webp'], minimumCacheTTL: 86400, remotePatterns: [{protocol:'https',hostname:'i.ytimg.com'}] },
  async headers() { return [{ source: '/(.*)', headers: [
    {key:'X-Content-Type-Options',value:'nosniff'}, {key:'X-Frame-Options',value:'SAMEORIGIN'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}, {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}
  ] }, {source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'}]}, {source:'/images/:path*',headers:[{key:'Cache-Control',value:'public, max-age=86400, stale-while-revalidate=604800'}]}]; }
};
export default config;
