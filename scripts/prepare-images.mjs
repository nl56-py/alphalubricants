import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/images',{recursive:true});
await sharp('public/images/hero-original.png').resize({width:1920,withoutEnlargement:true}).webp({quality:84}).toFile('public/images/hero-road.webp');
await sharp('logo.jpg').trim({threshold:20}).resize({width:640}).webp({quality:90}).toFile('public/images/logo.webp');
for (const name of ['sl','semi','sn']) await sharp(`public/images/product-${name}-original.jpg`).rotate().resize({width:1000,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(`public/images/product-${name}.webp`);
console.log('Optimized hero, logo and three original Alpha product photographs.');
