import { OilFinder } from '@/components/oil-finder/OilFinder';
import { getVehicles } from '@/lib/server/vehicle-data';
export const revalidate=120;
export const metadata={title:'Find engine oil for your vehicle in Nepal | Alpha Lubricants',description:'Choose your vehicle to find handbook specifications and available Alpha engine oil matches. No account required.'};
export default async function Page(){ return <main id="main-content"><OilFinder vehicles={await getVehicles()}/></main>; }
