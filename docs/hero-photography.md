# Consistent marketing heroes

The shared BrandHero uses a 600px desktop content area plus the 112px navigation offset. At widths up to 760px, the copy area is 520px and the photo is 270px. At widths up to 380px, the copy area is 580px to accommodate narrow headline wrapping. These are shared CSS tokens in app/globals.css; content can expand for zoom or unusually long future copy rather than being clipped. The homepage retains its licensed video with the same shared overall opening height.

Each top-level interior page has a dedicated temporary people photo. Industry, story, and article maps select individual images in components/marketing/headerPhotos.ts. To replace one, update its src and position there, or replace the corresponding local WebP. No remote stock dependency is needed at runtime. Blog articles use different photos from the available collection.

## Free placeholder sources

Downloaded November 1, 2026. All are free under the [Pexels license](https://www.pexels.com/license/), which permits website use and modification without required attribution. These are illustrative stock photos, not customer portraits or endorsements. Existing licensed homepage media and the authentication bakery image are retained.

| Asset key | Original source |
| --- | --- |
| pricing | [Pexels 6205738](https://www.pexels.com/photo/barista-preparing-coffee-while-working-in-cafe-6205738/) |
| invoice | [Pexels 6605226](https://www.pexels.com/photo/people-working-in-pizzeria-kitchen-6605226/) |
| agreement | [Pexels 12203873](https://www.pexels.com/photo/man-in-uniform-working-with-paperwork-12203873/) |
| about | [Pexels 15323387](https://www.pexels.com/photo/cooks-in-aprons-working-15323387/) |
| contact | [Pexels 5865195](https://www.pexels.com/photo/a-person-working-at-a-cafe-5865195/) |
| industries | [Pexels 8985606](https://www.pexels.com/photo/man-in-blue-work-clothes-fixing-a-car-8985606/) |
| customers | [Pexels 6284883](https://www.pexels.com/photo/businessman-posing-with-waiter-at-restaurant-6284883/) |
| compare | [Pexels 15441279](https://www.pexels.com/photo/people-working-in-restaurant-kitchen-15441279/) |
| help | [Pexels 8425197](https://www.pexels.com/photo/a-barista-working-in-a-cafe-8425197/) |
| blog | [Pexels 19553654](https://www.pexels.com/photo/people-working-in-a-restaurant-kitchen-19553654/) |
| demystifier | [Pexels 19168411](https://www.pexels.com/photo/people-working-in-a-kitchen-19168411/) |
| reviews | [Pexels 19595138](https://www.pexels.com/photo/waiter-standing-by-table-in-restaurant-19595138/) |
| industry | [Pexels 15671276](https://www.pexels.com/photo/woman-and-men-working-in-kitchen-15671276/) |
| customer | [Pexels 24205169](https://www.pexels.com/photo/two-people-working-in-a-kitchen-24205169/) |
| article | [Pexels 5461613](https://www.pexels.com/photo/focused-male-barista-working-at-cafe-counter-5461613/) |
| guide | [Pexels 8921549](https://www.pexels.com/photo/a-man-wearing-suit-8921549/) |
| healthcare | [Pexels 6129243](https://www.pexels.com/photo/a-doctor-and-a-nurse-working-together-in-a-hospital-6129243/) |
| manufacturing | [Pexels 32407077](https://www.pexels.com/photo/worker-operating-machinery-in-industrial-factory-32407077/) |
| hospitalStory | [Pexels 33932453](https://www.pexels.com/photo/nurse-assisting-patient-in-hospital-corridor-33932453/) |
| factoryStory | [Pexels 8113775](https://www.pexels.com/photo/man-using-machinery-in-a-factory-8113775/) |

## Verification

Desktop checks: top-level interior heroes measure 712px at the default browser width. At 900px, pricing, invoice, agreement, article and customer-story heroes also measure 712px. At 390px, sampled top-level pages and article/industry/story detail pages measure 902px without horizontal overflow. Production build, TypeScript and lint are checked before PR completion. Existing lint warnings are outside this visual change. Free-guide form retains its existing mock submission behavior and is now reached below the shared header.
