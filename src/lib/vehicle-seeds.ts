export type VehicleEntry = { id?: string; make: string; model: string; variant: string; category: string; marketSource: string; manualSource: string | null; viscosity: string | null; specification: string | null; productSlug: string | null; status: string; notes: string; active: boolean };
const rows: VehicleEntry[] = [];
function add(make: string, category: string, source: string, models: string[]) { for (const model of models) rows.push({ make, model, category, variant: 'Nepal catalogue — confirm year / engine', marketSource: source, manualSource: null, viscosity: null, specification: null, productSlug: null, status: 'PENDING', notes: 'This model is listed by the Nepal manufacturer or distributor. Its exact model year, engine and handbook oil requirements still need confirmation by Alpha. No product recommendation is published yet.', active: true }); }
add('Yamaha','Motorcycle','https://www.maw2wheelers.com/', ['R15 M BS6','R15 S','R15 V4 BS6','WR 155R','MT-15 V2','FZ-S FI Hybrid','FZ-S FI New Gen','FZS FI V3 BS6 Deluxe','FZ FI V3 BS6 Standard','FZS FI V2','FZ FI V2','FZ FI','Saluto 125 Disc','XSR 155']);
add('Yamaha','Scooter','https://www.maw2wheelers.com/', ['Aerox 155 BS6','Aerox S 155','Fascino S 125 FI Hybrid','Fascino Disc 125 FI Hybrid','RayZR 125 FI Street Rally Hybrid BS6','RayZR 125 Hybrid Drum','RayZR 125 Hybrid Disc']);
add('Bajaj','Motorcycle','https://www.bajajauto.com/en-np', ['Pulsar NS125 ABS FI BS6','Pulsar N125','Pulsar NS400 Z','Pulsar N250','Pulsar 220F','Pulsar NS200','Pulsar NS200 FI Dual ABS','Pulsar N160 Dual ABS','Pulsar N150','Pulsar 150 SD','Pulsar 150 TD','Pulsar 125','Dominar 400 BS6','Discover 125 Disc','Discover 125 ST','Avenger 220 Cruise','Avenger 160 Street ABS','Platina 100 ES']);
add('Bajaj','Three wheeler','https://www.bajajauto.com/en-np', ['RE 4S Petrol','Maxima Cargo']);
add('Hero','Motorcycle','https://www.heromotocorp.com/en-np/price-list', ['Splendor+','Super Splendor','Super Splendor Xtec','Xtreme 125R','Xpulse 200 4V','Xtreme 160R 4V','Xtreme 160R 4V Dual Channel ABS','Xpulse 210']);
add('Hero','Scooter','https://www.heromotocorp.com/en-np/price-list', ['Xoom 110','Xoom 110 FI OBD II','Xoom 125R FI']);
add('TVS','Motorcycle','https://www.tvsnepal.com/', ['RTR 160 2V FI','Raider Igo','Raider FI','RTR 200 4V RTFI BS6','RR 310','RTR 160 4V DD ABS','Radeon FI','RTR 160 2V ABS','Ronin','Raider FI Drum','Apache RTR 160 4V SE','Apache 160 4V USD','XL 100']);
add('TVS','Scooter','https://www.tvsnepal.com/', ['Jupiter','Ntorq XP','Ntorq RTFI BS6','Ntorq Disc FI']);
add('TVS','Three wheeler','https://www.tvsnepal.com/', ['King Deluxe Plus BSVI FI','King Duramax Plus BSVI FI','King Deluxe Plus','King Duramax Plus','King Cargo']);
add('Suzuki','Motorcycle','https://suzukimotorcycle.com.np/', ['Gixxer 155 FI BS6','V-Strom SX 250','Gixxer 155 FI BS4']);
add('Suzuki','Scooter','https://suzukimotorcycle.com.np/', ['Access 125 FI Disc Connect','Avenis 125 FI OBD','Burgman 125 FI']);
add('Royal Enfield','Motorcycle','https://www.royalenfield.com/np/en/motorcycles/', ['Guerrilla 450','Goan Classic 350','Hunter 350','Meteor 350','Scram 440','Classic 350','Himalayan 450']);
add('Suzuki','Car','https://www.suzuki.com.np/', ['Victoris','Brezza','Fronx','Jimny','Grand Vitara','Swift','Celerio','Wagon R','Alto K10','Eeco','Eeco Cargo']);
add('Honda','Car','https://honda.com.np/services/showrooms/', ['Elevate','City e:HEV','Amaze New','City 5th Gen']);
add('Honda','Motorcycle','https://honda.com.np/wp-content/uploads/product-catalog/motorcycles/Shine-BS6.pdf', ['Shine BS6']);
add('Honda','Motorcycle','https://honda.com.np/wp-content/uploads/product-catalog/motorcycles/Hornet-2.0-Brochure_11zon.pdf', ['Hornet 2.0']);

// Exact manual variants only. Generic Nepal catalogue entries remain pending.
for (const [model,variant,file] of [
  ['Super Splendor','FI BS6 — October 2021 handbook','Super_Splendor_FI_%28Oct_2021%29-Hindi.pdf'],
  ['Super Splendor Xtec','ADGA — February 2023 handbook','Super_Splendor_Xtec_%28Feb_2023%29.pdf'],
] as const) rows.push({ make:'Hero',model,variant,category:'Motorcycle',marketSource:'https://www.heromotocorp.com/en-np/price-list',manualSource:`https://www.heromotocorp.com/content/dam/hero-aem-website/in/service-owner-manual/${file}`,viscosity:'10W-30',specification:'API SL · JASO MA2',productSlug:'alpha-sl-800ml',status:'VERIFIED',notes:'Specification match to the linked manufacturer handbook and the Alpha SL product label. Applies only when your exact vehicle and handbook match this edition; Nepal variants can differ. Check the required fill quantity in your handbook: one 800 ml bottle is not necessarily a full oil change.',active:true });
export const vehicleSeeds = rows;
