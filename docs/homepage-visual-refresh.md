# Homepage visual refresh — review draft

The redesign keeps the navy, teal, DM Serif Display, and DM Sans brand system. It replaces the full-size simulated savings dashboard with a photographic hero and service cards, then keeps a smaller, clearly illustrative invoice report below the process explanation. FeaturedReviews remains server-rendered through its existing Suspense slot. The existing annual offer, chat, navigation, and cookie controls remain in the app layout.

## Asset selection and budget

Do not purchase or license assets on the user's behalf. The user will license and supply final assets. Target **1-credit standard commercial photos**; do not assume credit cost from a search result or a Standard License label. The exact cost must be checked in the user's account before they license it. Premium, extended-license, and expensive credit-pack selections are outside the photo budget. Video cost is a separate user decision.

Recommended shopping list:

| Placement | Direction | Adobe starting point |
| --- | --- | --- |
| Uniform card | Close-up of navy work shirts on a service rack, no visible vendor marks | [Uniform rack photos](https://stock.adobe.com/search?k=commercial+uniform+shirts+rack&filters%5Bcontent_type%3Aphoto%5D=1) |
| Linen card | White restaurant linens or blue-stripe kitchen towels, natural light | [Kitchen towel photos](https://stock.adobe.com/search?k=folded+commercial+kitchen+towels&filters%5Bcontent_type%3Aphoto%5D=1) |
| Mat card | Black commercial entrance or kitchen mat in a real workplace | [Commercial mat photos](https://stock.adobe.com/search?k=commercial+entrance+floor+mat&filters%5Bcontent_type%3Aphoto%5D=1) |
| Hero footage | Slow movement through a garment rack; calm, no vendor branding; leave room at left for copy | [Candidate #2065739312, Alessio](https://stock.adobe.com/video/slow-motion-slider-of-freshly-cleaned-shirts-hanging-in-professional-laundry-facility-rack-of-freshly-laundered-shirts-hanging-inside-a-commercial-laundry-representing-garment-care/2065739312) |

The video candidate is 12 seconds and has an HD option (2048 × 1080). Its credit price is **not verified**. It is a candidate for the user to preview and price, not a purchase recommendation at an assumed budget. Photos above are focused searches, not verified 1-credit selections. Prefer Photos, Exclude Generative AI, commercial use, and standard collection results when selecting replacements.

## Current draft assets

All files under `public/images/home/*-draft.webp` are generated representative imagery made for this layout review, not licensed Adobe photographs or customer images. The uniform, linen, and mat thumbnails are optimized crops of the generated scene. No Adobe preview or watermark has been included in the app.

Replace the hero image reference in HeroMedia.tsx and the service image paths in HomeContent.tsx with the licensed files. Keep the license receipt and original Adobe file ID with the project. Do not remove draft naming until the selected replacements are actually supplied.

## Video handoff

After the user supplies the licensed footage, prepare an 8–12 second muted MP4 loop, preferably 1080p and approximately 2–5 MB, plus an optimized poster. Add the local file under public/images/home and set `videoSrc` in HeroMedia.tsx. Playback is currently disabled because `videoSrc` is null.

The component only mounts video on desktop when reduced motion and data saver are off. It includes a pause/play control, an image fallback on video errors, no audio, and no video download for mobile or reduced-motion users. These playback paths still need browser testing with the final footage. The static poster layout has been reviewed on desktop and at 390px mobile width.

## Verification

- TypeScript passed.
- Targeted ESLint passed.
- Webpack production build passed (existing Edge Runtime deprecation warning remains).
- Desktop and mobile full-page screenshots reviewed.
- Existing review and annual-offer logic was not modified.
- Production has not been changed. Final media selection is pending the user.
