# Homepage visual refresh

The homepage keeps the navy, teal, DM Serif Display, and DM Sans brand system. A photographic video hero and service cards introduce the items being reviewed, followed by the invoice process and a smaller, clearly illustrative report. FeaturedReviews remains in its existing server-rendered Suspense slot. Annual offers, navigation, chat, and cookie controls remain in the app layout.

## Licensed media

On October 31, 2026, the user licensed and downloaded the following Adobe Stock files and authorized replacing the generated placeholders. The prices below were observed in the user's signed-in account before licensing. No assets were purchased by the agent.

| Use | Adobe file ID | Contributor | Observed price | App asset |
| --- | --- | --- | --- | --- |
| Uniforms | 1820470742 | CoreRock | Standard License, 1 plan credit | public/images/home/uniforms.webp |
| Linens | 220790732 | fascinadora | Standard License, 1 plan credit | public/images/home/linens.webp |
| Floor mats | 2234744105 | ZackZephyr | Standard License, 1 plan credit | public/images/home/mats.webp |
| Hero footage | 2065739312 | Alessio | 8 plan credits for HD or 4K | public/images/home/laundry-hero.mp4 |

The mat image replaces rejected asset 2234736112, whose preview had an incomplete gray area. Original licensed files remain in the user's Downloads folder. The app contains optimized web derivatives, not the large source files. The generated draft assets have been removed.

## Media delivery

- Hero: 12-second H.264 MP4, 24 fps, approximately 2 MB, no audio, yuv420p, fast-start metadata. The source MOV was approximately 491 MB.
- Poster: WebP extracted from the web video's first frame, approximately 42 KB.
- Photos: WebP with embedded metadata removed; Next Image generates responsive delivery sizes. The portrait mat composition is positioned toward the lower part of the image to keep the mat visible in its landscape card.
- Video mounts only on desktop when reduced-motion and data-saver preferences are off. Its source is not rendered for mobile. A visible keyboard-accessible pause/play button controls playback. The poster remains available on playback failure.

## Release

The changes are maintained in the homepage visual refresh pull request. Production is unchanged until that release is merged and deployed. No database or billing changes are included.

## Verification

TypeScript, targeted ESLint, whitespace checks, and the webpack production build passed. Browser checks confirmed muted desktop playback, pause, resume, complete photos, and a fresh 390px mobile load with no video element and no horizontal overflow. Desktop and mobile screenshots were reviewed. Reduced-motion and data-saver gating remain implemented; those preference overrides were inspected in code rather than emulated in this browser session.
