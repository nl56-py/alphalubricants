import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ApiError, route } from '@/lib/server/http';
export const runtime = 'nodejs';
export const GET = route(async (request, context) => {
  const { file } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|mp4|webm)$/.test(file)) throw new ApiError(404, 'Media not found.');
  try {
    const bytes = await readFile(resolve(process.env.UPLOAD_DIR || './storage/uploads', file));
    const headers: Record<string, string> = { 'Content-Type': file.endsWith('.mp4') ? 'video/mp4' : file.endsWith('.webm') ? 'video/webm' : 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
    const range = request.headers.get('range');
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.length}` } });
      const start = match[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
      if (start > end || start >= bytes.length) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.length}` } });
      headers['Content-Range'] = `bytes ${start}-${end}/${bytes.length}`;
      headers['Content-Length'] = String(end - start + 1);
      return new Response(new Uint8Array(bytes.subarray(start, end + 1)), { status: 206, headers });
    }
    headers['Content-Length'] = String(bytes.length);
    return new Response(new Uint8Array(bytes), { headers });
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new ApiError(404, 'Image not found.'); throw error; }
});
