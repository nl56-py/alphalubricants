import { db, hasDatabase } from './db';
import { vehicleSeeds } from '@/lib/vehicle-seeds';
import { unstable_cache } from 'next/cache';
export const getVehicles = unstable_cache(async () => {
  const fallback = vehicleSeeds.map((row,i)=>({...row,id:`seed-${i}`}));
  if (!hasDatabase()) return fallback;
  try {
    const [vehicles,products] = await Promise.all([
      db.vehicleOil.findMany({where:{active:true},orderBy:[{make:'asc'},{model:'asc'}]}),
      db.product.findMany({where:{active:true},select:{slug:true}}),
    ]);
    const available = new Set(products.map(product=>product.slug));
    return vehicles.map(vehicle => vehicle.status === 'VERIFIED' && !available.has(vehicle.productSlug || '')
      ? {...vehicle,status:'PENDING',productSlug:null,notes:'The linked product is currently unavailable. Contact Alpha to confirm a suitable oil for your exact vehicle.'}
      : vehicle);
  } catch (error) {
    console.error('[vehicle-data]', error instanceof Error ? error.message : 'Database unavailable');
    return fallback;
  }
}, ['vehicle-oil-finder'], {revalidate:120,tags:['vehicles','products']});
