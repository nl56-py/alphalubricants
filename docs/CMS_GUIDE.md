# Managing the expanded website

Sign in at `/admin` with the local credentials in `.local/credentials.txt`.

## Website content

Choose the relevant content tab, add a record and enable **Publish on the website** when ready.

| Type | Public location | Fields to use |
| --- | --- | --- |
| HERO | Homepage carousel | Image, optional uploaded MP4/WebM, title, short description, destination, display order |
| GALLERY | Homepage and gallery | Image, title, short description |
| OFFER | Homepage and offers | Image, offer title, summary, terms/details, destination |
| VIDEO | Homepage, videos and gallery | Uploaded MP4/WebM **or** YouTube URL, title, description, optional poster |
| SOCIAL | Homepage social cards | Network, image, caption, original post/profile link |
| BLOG | Homepage and blog | Cover image, title, slug, summary, article text |
| REVIEW | Homepage customer reviews | Actual customer name, quote, rating, optional photo and short context |
| RIDER_PROFILE | Rider community | Public rider name, photo, short biography, details, social link |

Hero media preserves its aspect ratio and is fully visible. Portrait uploads have space beside them on desktop. Video playback stays muted in the hero; content videos have playback controls. Uploads accept MP4/WebM up to 40 MB. Social cards are curated posts, not an automatically synchronized social feed. Customer reviews and rider identities are not fabricated; add approved real content before publishing.

## Vehicle oil finder

`/admin/oil-finder` manages make, model, exact variant, manufacturer handbook sources, viscosity/specification and matching product. Customers use `/oil-finder` without signing in.

The initial research dataset contains **106 vehicle/model-variant entries**, including **2 verified specification matches** and **104 pending mappings**. Pending entries never recommend an oil. Verify the exact model year/engine handbook and Alpha product label before setting a mapping to Verified. See `vehicle-oil-data.md` for sources and limits.

## Riders and dealerships

Rider public biographies use Website content → Rider profiles. Rider account passwords, order assignments and sales access remain under Rider team.

Customers submit dealership contact and business details at `/dealership`. `/admin/dealership` supports search, pagination, status and internal follow-up notes. Enquiries are saved to MySQL; this feature does not send automatic emails or create a dealership contract.

Offers are editorial CMS records. Configure a redeemable discount separately under Promotions, and include its code and terms in the offer content.
