import { db, hasDatabase } from './db';
import { vehicleSeeds } from '@/lib/vehicle-seeds';
import { unstable_cache } from 'next/cache';
export const getVehicles = unstable_cache(async () => {
  if (!hasDatabase()) return vehicleSeeds.map((row,i)=>({...row,id:`seed-${i}`}));
  const [vehicles,products] = await Promise.all([
    db.vehicleOil.findMany({where:{active:true},orderBy:[{make:'asc'},{model:'asc'}]}),
    db.product.findMany({where:{active:true},select:{slug:true}}),
  ]);
  const available = new Set(products.map(product=>product.slug));
  return vehicles.map(vehicle => vehicle.status === 'VERIFIED' && !available.has(vehicle.productSlug || '')
    ? {...vehicle,status:'PENDING',productSlug:null,notes:'The linked product is currently unavailable. Contact Alpha to confirm a suitable oil for your exact vehicle.'}
    : vehicle);
}, ['vehicle-oil-finder'], {revalidate:120,tags:['vehicles','products']});
