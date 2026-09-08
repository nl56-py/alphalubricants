import { PrismaClient } from '@prisma/client';
import { vehicleSeeds } from '../src/lib/vehicle-seeds';
const db = new PrismaClient();
async function main() {
  if (vehicleSeeds.length < 100) throw new Error('At least 100 researched catalogue records are required.');
  for (const item of vehicleSeeds) await db.vehicleOil.upsert({ where: { make_model_variant: { make:item.make,model:item.model,variant:item.variant } }, create:item, update:{} });
  console.log(`Seeded ${vehicleSeeds.length} Nepal vehicle records (${vehicleSeeds.filter(x=>x.status==='VERIFIED').length} manual-specific Alpha matches). Existing admin edits preserved.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.$disconnect());
