import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { adminGuard } from '@/lib/server/admin';
import { ApiError, readBytes, route } from '@/lib/server/http';
export const runtime = 'nodejs';
export const POST = route(async request => {
  const actor = await adminGuard(request, true);
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data;')) throw new ApiError(415, 'Upload a multipart image file.');
  const bytes = await readBytes(request, 41 * 1024 * 1024);
  const form = await new Response(new Uint8Array(bytes), { headers: { 'content-type': contentType } }).formData();
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) throw new ApiError(400, 'Choose an image file.');
  if (['video/mp4', 'video/webm'].includes(file.type)) {
    if (file.size > 40 * 1024 * 1024) throw new ApiError(413, 'Keep background videos under 40 MB.');
    const buffer = Buffer.from(await file.arrayBuffer());
    const isMp4 = file.type === 'video/mp4' && buffer.subarray(4, 8).toString() === 'ftyp';
    const isWebm = file.type === 'video/webm' && buffer.subarray(0, 4).toString('hex') === '1a45dfa3';
    if (!isMp4 && !isWebm) throw new ApiError(400, 'The file is not a supported MP4 or WebM video.');
    const directory = resolve(process.env.UPLOAD_DIR || './storage/uploads');
    const filename = `${randomUUID()}.${isMp4 ? 'mp4' : 'webm'}`;
    await mkdir(directory, { recursive: true }); await writeFile(resolve(directory, filename), buffer, { flag: 'wx' });
    return NextResponse.json({ url: `/api/media/${filename}`, mediaType: 'video' }, { status: 201 });
  }
  if (file.size > 8 * 1024 * 1024) throw new ApiError(413, 'Keep images under 8 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new ApiError(415, 'Use JPEG, PNG, WebP or AVIF images.');
  let output: { data: Buffer; info: sharp.OutputInfo };
  try { output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000, animated: false }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true }); }
  catch { throw new ApiError(400, 'The image could not be decoded or exceeds 40 megapixels.'); }
  const directory = resolve(process.env.UPLOAD_DIR || './storage/uploads'); const filename = `${randomUUID()}.webp`;
  await mkdir(directory, { recursive: true }); await writeFile(resolve(directory, filename), output.data, { flag: 'wx' });
  // Only random file names and decoded bitmap output are served by the media route.
  void actor;
  return NextResponse.json({ url: `/api/media/${filename}`, width: output.info.width, height: output.info.height }, { status: 201 });
});
