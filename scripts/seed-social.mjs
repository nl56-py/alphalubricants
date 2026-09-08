import {PrismaClient} from '@prisma/client';
process.loadEnvFile();
const db=new PrismaClient();
try {
 const entries=[['alpha-racing','On the circuit.','A closer look at the Alpha-branded motorcycle on track.','/images/alpha-racing.webp'],['alpha-track','Into the corner.','Riding moments from the Alpha photo collection.','/images/alpha-track.webp'],['alpha-offroad','Beyond the everyday road.','Explore the off-road side of our riding community.','/images/alpha-offroad.webp'],['alpha-products','Find your Alpha.','Explore our motorcycle engine oil range and find the specifications for your next service.','/images/product-sl.webp']];
 for(const [i,[slug,title,excerpt,image]] of entries.entries()) await db.content.upsert({where:{slug:'social-'+slug},create:{type:'SOCIAL',slug:'social-'+slug,title,excerpt,image,platform:'Facebook',link:'https://www.facebook.com/profile.php?id=61575309551050',published:true,sortOrder:i},update:{}});
 console.log('Four curated Alpha social cards added. Existing content preserved.');
}finally{await db.$disconnect()}
