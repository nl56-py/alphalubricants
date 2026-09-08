# Vehicle oil finder research

Research date: 9 September 2026. `src/lib/vehicle-seeds.ts` contains more than 100 distinct model/variant records from official Nepal manufacturer and distributor catalogues. Each record retains its Nepal market source. Generic catalogue records are deliberately PENDING; catalogues establish presence in Nepal, not oil suitability, model year or current stock. No synthetic model-year multiplication or colour variants are used to reach the count.

The seed includes two exact Hero handbook variants with Alpha SL 10W-30 / API SL / JASO MA2 specification matches: Super Splendor FI BS6 (October 2021 Hindi handbook), and Super Splendor Xtec ADGA (February 2023 handbook). Both are primary manufacturer PDFs linked in each record. Matching is based on the existing Alpha SL product label, not an OEM endorsement. The public result explains that the exact Nepal vehicle handbook must agree and the 800 ml retail pack may not be sufficient for a full change.

- [Super Splendor FI BS6 October 2021 handbook](https://www.heromotocorp.com/content/dam/hero-aem-website/in/service-owner-manual/Super_Splendor_FI_%28Oct_2021%29-Hindi.pdf)
- [Super Splendor Xtec ADGA February 2023 handbook](https://www.heromotocorp.com/content/dam/hero-aem-website/in/service-owner-manual/Super_Splendor_Xtec_%28Feb_2023%29.pdf)

Primary catalogue sources: Yamaha MAW (maw2wheelers.com), Bajaj Nepal (bajajauto.com/en-np), Hero Nepal price list, TVS Nepal, VG Suzuki motorcycles, Royal Enfield Nepal, CG Suzuki cars and Honda Nepal. Full links are retained in every seed record. A motorcycle product is never automatically recommended to a car or scooter.

Run after migrations and Prisma generation: `node --env-file=.env --import tsx scripts/seed-vehicles.ts`. Seeding is idempotent and does not overwrite administrator edits. The admin page `/admin/oil-finder` supports adding, editing and hiding vehicles, selecting a product, and publishing verified matches with mandatory manual/specification evidence. Existing administrator authentication, origin protection and audit logging apply. Public `/oil-finder` requires no login.
