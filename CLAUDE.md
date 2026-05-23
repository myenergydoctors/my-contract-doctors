# My Contract Doctors — Claude Code Project Brief

## What this project is
An AI-powered SaaS platform helping businesses identify overpayments and optimize uniform and linen service contracts. Sister company to My Energy Doctors (myenergydoctors.com).

**Live site:** https://mycontractdoctors.com  
**GitHub:** https://github.com/myenergydoctors/my-contract-doctors  
**Hosting:** Vercel (auto-deploys on push to main)  
**Owner:** Jesse Fowler / OSC Web Design

---

## Tech Stack
- **Framework:** Next.js 16.2.1 (TypeScript, App Router)
- **Styling:** Tailwind CSS v4 + inline styles (partial — see Current State below)
- **AI:** Anthropic Claude API (server-side secured routes)
- **Email:** SendGrid (`@sendgrid/mail`)
- **Payments:** Stripe (not yet implemented — mocked UI only)
- **Hosting:** Vercel
- **Domain registrar:** GoDaddy
- **Version control:** GitHub (`myenergydoctors/my-contract-doctors`)

---

## Brand Identity
- **Colors:**
  - Navy: `#0C2D54` → Tailwind: `bg-navy`
  - Navy Dark: `#081E38` → Tailwind: `bg-navy-dark`
  - Sky Blue: `#3D80C8` → Tailwind: `bg-blue`
  - Blue Mid: `#2563A8` → Tailwind: `bg-blue-mid`
  - Light Blue: `#6AAEE0` → Tailwind: `bg-blue-light`
  - Blue Pale: `#E2EEFA` → Tailwind: `bg-blue-pale`
  - Savings Green/Teal: `#17A882` → Tailwind: `bg-teal`
  - Teal Light: `#D4F2EA` → Tailwind: `bg-teal-light`
  - Off White: `#F7F9FC` → Tailwind: `bg-off-white`
  - Gray 100–700: standard grays
  - Red: `#DC2626`, Amber: `#D97706`, Green: `#16A34A`
- **Fonts:** DM Serif Display (headlines/italic) + DM Sans (body, light 300) — loaded in `globals.css`
- **Tagline:** "We're on your side, not the vendor's."

---

## Project Structure
```
app/
├── page.tsx                    # Homepage
├── layout.tsx                  # Shared layout — Nav + Footer injected here
├── globals.css                 # Tailwind v4 + brand color tokens + animations
├── invoice/page.tsx            # The Invoice — upload + AI analysis flow
├── demystifier/page.tsx        # The Demystifier — contract education tool
├── agreement/page.tsx          # The Agreement — personalized AI contract analysis
├── contact/page.tsx            # Contact form (SendGrid wired up)
├── blog/
│   ├── page.tsx                # Blog index (reads from lib/posts.ts)
│   └── [slug]/page.tsx         # Dynamic blog post route
└── api/
    ├── analyze-invoice/route.ts    # Server-side Anthropic API call
    ├── analyze-agreement/route.ts  # Server-side Anthropic API call
    └── contact/route.ts            # SendGrid email delivery

components/
├── Nav.tsx                     # Shared nav — sticky, scroll effect, all links
└── Footer.tsx                  # Shared footer — 4-column grid

lib/
├── posts.ts                    # Central blog post metadata (Post type + posts array)
└── posts/
    └── auto-renewal-clause.ts  # First blog post content file
```

---

## Three Products

### The Invoice (`/invoice`)
- Free entry point
- User uploads invoice (desktop drag/drop or QR mobile scan)
- AI analyzes line items via `/api/analyze-invoice`
- Shows 1 free recommendation, rest locked behind upgrade
- Upgrade modal: one-time $29.99 or subscription $19.99/mo (MOCKED — Stripe not wired)

### The Demystifier (`/demystifier`)
- $49.99 one-time purchase (MOCKED — Stripe not wired)
- Pre-purchase: marketing/education page
- Post-purchase: 3-column split-screen app
- Uses real ImageFirst/Berstein-Magoon-Gay LLC contract (Ragged Coast Chocolates)
- 8 clauses from actual contract mapped with explanations, risk ratings, negotiation emails

### The Agreement (`/agreement`)
- Personalized AI contract analysis (price TBD — currently shows $XX placeholder)
- Upload flow → AI scanning → full scorecard + clause viewer
- Uses `/api/analyze-agreement` server-side route
- Downloads .txt report, generates personalized negotiation emails

---

## Environment Variables Required
```
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG....
```
- Add to `.env.local` for local development
- Add to Vercel Environment Variables for production

---

## Deployment Workflow
```bash
git add .
git commit -m "description"
git push
```
Vercel auto-deploys in ~60 seconds on push to main.

---

## Current State & What's Done ✅
- All 6 page routes live and routing correctly
- Shared Nav (fixed, scroll effect, all links working)
- Shared Footer (4-column, all links)
- File-based blog with dynamic post routing (`/blog/[slug]`)
- Server-side Anthropic API routes (API key secured)
- Contact form wired to SendGrid (sends to jesse@myenergydoctors.com, confirms to user)
- SendGrid domain verified (mycontractdoctors.com via GoDaddy)
- TypeScript build errors suppressed (`ignoreBuildErrors: true`)

---

## Outstanding Priorities (in order)

### 1. Fix Contact Form SendGrid Error
The form submits but returns a server error. Likely cause: `SENDGRID_API_KEY` missing from Vercel environment variables, or sender `noreply@mycontractdoctors.com` not fully verified. Check:
- Vercel → Settings → Environment Variables → confirm `SENDGRID_API_KEY` is there
- SendGrid → Sender Authentication → confirm domain is verified
- API route is at `app/api/contact/route.ts`

### 2. Complete Tailwind CSS Rewrite
**This is partially done.** Nav and Footer are clean. Contact page is rewritten. All other pages still use inline styles with a `const C = { navy: "#0C2D54", ... }` color object at the top.

**Goal:** Remove all inline styles from page files. Use Tailwind utility classes throughout. The `globals.css` already has all brand colors registered as Tailwind tokens (`--color-navy`, `--color-teal`, etc.) so `bg-navy`, `text-teal`, `border-blue-pale` etc. all work.

**Pages still needing rewrite (simplest to hardest):**
1. `app/blog/page.tsx`
2. `app/blog/[slug]/page.tsx`
3. `app/page.tsx` (homepage)
4. `app/demystifier/page.tsx`
5. `app/invoice/page.tsx`
6. `app/agreement/page.tsx`

**Note:** Some inline styles must stay — dynamic values like `width: ${progress}%`, SVG attributes, and styles computed from JavaScript variables at runtime.

### 3. Stripe Payments
- Demystifier: $49.99 one-time
- Agreement: price TBD (currently shows $XX placeholder)
- Invoice upgrade: $29.99 one-time or $19.99/mo subscription
- All payment modals exist in the UI but are mocked (they simulate success after 2 seconds)
- Need: Stripe account, product/price IDs, webhook to unlock access after payment

### 4. Agreement Pricing
Currently shows `$XX` placeholder throughout the Agreement page. Decide on price and do a find/replace.

### 5. Add More Blog Posts
Only one content file exists: `lib/posts/auto-renewal-clause.ts`
Seven more post slugs are defined in `lib/posts.ts` but have no content files yet — they show "Loading..." when clicked.

**To add a new post:**
1. Add entry to `lib/posts.ts`
2. Create `lib/posts/your-slug.ts` with `export const content = [...]`
3. Push — live in 60 seconds

**Content block types supported:** `p`, `h2`, `h3`, `quote`, `list`, `callout` (variants: red/teal/amber/blue)

### 6. Fill Placeholder Content
- Contact page: phone number, email address, hours (currently placeholder)
- Agreement page: pricing ($XX)
- Any other placeholder copy

### 7. Custom Logo
Currently using text-only logo in Nav and Footer. SVG or image logo to be created.

### 8. Mobile Responsive Pass
Nav collapses on mobile via CSS media query on homepage. Full mobile responsiveness pass not done across all pages.

---

## Blog System
File-based, no CMS. Jesse is the sole author.

**To add a new post:**
```typescript
// 1. Add to lib/posts.ts
{
  slug: "your-slug",
  title: "Your Post Title",
  excerpt: "Brief description.",
  category: "Know Your Contract", // or Negotiation, Vendor Comparison, Save Money, Resources
  categoryColor: "red", // red | amber | blue | teal
  date: "March 18, 2026",
  readTime: "5 min read",
  featured: false, // only one post should be featured: true
}

// 2. Create lib/posts/your-slug.ts
export const content = [
  { type: "p", text: "Paragraph text." },
  { type: "h2", text: "Section heading" },
  { type: "h3", text: "Sub-heading" },
  { type: "quote", text: "Block quote text." },
  { type: "list", items: ["Item one", "Item two", "Item three"] },
  { type: "callout", variant: "red", title: "Important", text: "Callout body." },
  // variant options: red | teal | amber | blue
];
```

---

## Key Design Decisions
- **No external CMS** — file-based blog preferred, Jesse is sole author
- **TypeScript strict mode off** — `strict: false` in tsconfig, `ignoreBuildErrors: true` in next.config.ts to prevent type errors blocking builds
- **Fonts loaded globally** — in `globals.css` via `@import url(...)` at top of file (must be first line)
- **Tailwind v4** — uses `@theme inline` in globals.css for custom tokens, NOT a tailwind.config.js file
- **API key security** — Anthropic key never exposed to browser, always called via `/api/` routes

---

## SendGrid Email Config
- **To:** jesse@myenergydoctors.com
- **From:** noreply@mycontractdoctors.com
- **Domain verified:** mycontractdoctors.com (via GoDaddy DNS)
- **API route:** `app/api/contact/route.ts`
- Sends two emails on form submit: notification to Jesse + confirmation to user

---

## Sister Company Reference
My Energy Doctors (myenergydoctors.com) — same owner, different product (energy bill savings). Used as design/brand reference. Linked in footer and contact page.
