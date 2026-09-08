import sharp from 'sharp';
import {PrismaClient} from '@prisma/client';
process.loadEnvFile();
const files=[['WhatsApp Image 2026-09-08 at 15.03.17 (2).jpeg','alpha-racing'],['WhatsApp Image 2026-09-08 at 15.03.17 (1).jpeg','alpha-track'],['WhatsApp Image 2026-09-08 at 14.59.40.jpeg','alpha-offroad']];
for(const [source,target] of files)await sharp('public/images/'+source).rotate().webp({quality:88}).toFile('public/images/'+target+'.webp');
const db=new PrismaClient();
try{
for(const [old,image] of [['/images/hero-road.webp','/images/alpha-racing.webp'],['/images/motorcycle.webp','/images/alpha-track.webp'],['/images/car.webp','/images/alpha-offroad.webp']])await db.content.updateMany({where:{image:old},data:{image}});
for(const [i,[,name]] of files.entries())await db.content.upsert({where:{slug:name},create:{type:'GALLERY',slug:name,title:['Alpha on the circuit','Into the corner','Beyond the road'][i],image:'/images/'+name+'.webp',published:true,sortOrder:10+i},update:{}});
console.log('WhatsApp images mapped to CMS hero content and gallery.');
}finally{await db.$disconnect();}
