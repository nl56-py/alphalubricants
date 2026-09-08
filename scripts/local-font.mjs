import {mkdir,writeFile} from 'node:fs/promises';
const css=await(await fetch('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&display=swap',{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}})).text();
const url=[...css.matchAll(/url\((https:[^)]+)\)/g)].at(-1)?.[1];
if(!url)throw new Error('Font not found');
await mkdir('public/fonts',{recursive:true});
await writeFile('public/fonts/dm-sans.woff2',Buffer.from(await(await fetch(url)).arrayBuffer()));
console.log('Font saved locally.');
