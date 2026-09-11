# CVONLINE247 — Design Documentation

Single-page marketing/landing site for a CV/recruitment platform connecting job seekers ("employees") with employers. Built as static HTML with Tailwind CSS (via CDN + inline config) and a small amount of vanilla JS.

## Tech Stack

- **HTML**: [index.html](index.html) — single static page, no build step
- **Styling**: Tailwind CSS via CDN (`cdn.tailwindcss.com`) with an inline `tailwind.config` for custom theme tokens, plus a small custom stylesheet [styles.css](styles.css) for a few things Tailwind utilities don't cover cleanly (carousel dots, hero badge, checkmarks)
- **Fonts**: Both families come from Google Fonts in a single `<link>` with `preconnect` — **Inter** (400/500/600/700/800) for all body text and buttons, **Space Grotesk** (600/700) for headings (see [Typography](#typography))
- **JS**: [script.js](script.js) — vanilla JS, no framework, no dependencies. Handles the hero image carousel and the mobile nav toggle
- **Assets**: local images only, under `images/hero/` (10 hero carousel photos) and `images/banners/` (5 section banner photos)

There is no backend, routing, or state management — this is a static front-end shell/prototype (forms don't submit anywhere, nav links are all `#`, buttons have no handlers except the two wired in `script.js`).

## Theme / Design Tokens

Defined in `tailwind.config.theme.extend.colors` in [index.html](index.html):

| Token | Value | Usage |
|---|---|---|
| `bg` | `#000000` | Page background (pure black) |
| `surface` / `card` | `#09122a` | Card backgrounds, form inputs, gradient end |
| `border` | `#273857` | Component outlines — cards, inputs, pills, table rules. Section dividers no longer use it (see the band classes below) |
| `accent` | `#2981fb` | Primary buttons, icon chips, active states |
| `accent-glow` | `#00bfff` | Highlighted text, eyebrow labels, active carousel dot |
| `success` | `#31c35a` | Checkmark bullets |
| `muted` | `#99a6b8` | Secondary/body copy |

Overall palette is a dark, "tech/SaaS" theme with a blue accent on a pure black page background — high contrast white text on black, navy surfaces for cards/inputs, blue for CTAs and emphasis, green for affirmations (checkmarks).

Custom breakpoint: `xs: 420px` added below Tailwind's default `sm` for very small phones.

### Section bands

Sections are separated by soft gradient seams, not hairlines. Two classes in [styles.css](styles.css) do the work, and every top-level block carries one:

| Class | Effect |
|---|---|
| `.band` | Transparent core with a `rgba(39,56,87,0.18)` fade across the top and bottom 12%. Resolves to the black page background in the middle |
| `.band-tint` | Same edge fade plus a lifted `rgba(9,18,42,0.55)` core, so the section reads as a distinct darker slab |

They alternate down the page (header `band`, hero `band-tint`, how-it-works `band`, why-us `band-tint`, compare `band`, FAQ `band-tint`, CTA `band`, footer `band-tint`) so no two neighbours share a tone, and where two bands meet their fades overlap into a ~20px glow instead of a 1px rule. The hero and CTA `<section>`s are full-bleed for this reason — their `max-w-7xl mx-auto` constraint sits on an inner wrapper, not the section itself.

## Typography

| Role | Font | Usage |
|---|---|---|
| Headline | **Space Grotesk** | All headings (`h1`–`h3`): hero H1, section H2s, card/compare/footer H3s, plus eyebrow/label text and the hero stage's `.stage-eyebrow` / `.stage-title` |
| Body / button | **Inter** | Body copy, nav links, **all buttons** (CTAs, nav, form submit, the `.seg` toggle and the FAQ question buttons), form fields, footer links — everything that isn't a heading or label |

Implementation (same block in every page — [index.html](index.html), [employees.html](employees.html), [employers.html](employers.html), [contact.html](contact.html)):
- `Inter` is the Tailwind `sans` default (`fontFamily.sans`), so body text and buttons get it without any class
- `fontFamily.heading: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']` in `tailwind.config`; Inter is the first fallback, so a failed font load degrades to the body face rather than a system serif
- Both families load from one combined Google Fonts request (`family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap`), covered by the existing `preconnect` tags
- [styles.css](styles.css) hardcodes the same heading stack on `.stage-eyebrow` and `.stage-title`, which aren't styled through Tailwind
- The `font-heading` utility goes on headings and eyebrow labels only — never on a `<button>`. The FAQ `.faq-q` buttons dropped it so every button is Inter. Current usages: 38 on index, 31 on employees, 32 on employers, 18 on contact

**Space Grotesk is a Google Fonts family** — by Florian Karsten, open source under the SIL Open Font License. It needs no `@font-face` block, no `fonts/` folder, and no third-party CDN; it comes from the same `fonts.googleapis.com` request as Inter. It's a proportional grotesque with quirky geometric details (the `a`, `G`, `R`, `y`), which gives headings a distinct technical character next to the neutral Inter body.

**Heading weight: `font-semibold` (600), everywhere.** Hierarchy is carried by size and tracking alone — the responsive size scale is wide enough (`text-xs` footer columns up to `text-6xl` hero) that weight contrast isn't needed. This replaced an earlier 800/700/600 split that had no documented rationale. Only 600 and 700 are requested from Google Fonts; 700 is currently unused headroom.

The one deliberate exception is the **wordmark** ([index.html](index.html) header): it stays `font-extrabold` (800) and does *not* carry `font-heading`. It's a logotype rather than a heading, and holding it heavier keeps the brand mark distinct now that every real heading sits at 600.

## Page Structure (top to bottom)

1. **Header** (`<header>`)
   - Logo (emoji badge + wordmark "CVONLINE247" + tagline "Your CV. Online 24/7.")
   - Desktop nav (`lg:` and up): For Employees, For Employers, Browse Candidates, Pricing, Resources
   - Right side: language toggle ("EN"), Login, Sign Up (desktop only), hamburger menu button (mobile/tablet)
   - Mobile menu: hidden `<div id="mobileMenu">` toggled via JS, duplicates nav links + Login/Sign Up stacked

2. **Hero section**
   - Two-column grid (stacks on mobile): image carousel on one side, headline/copy/CTAs on the other
   - **Carousel** (`#heroCarousel`): 10 absolutely-stacked `.slide` divs (one per `images/hero/*.jpg`), each with a dark gradient overlay and a bottom-left "badge" label (e.g. "Recruiting team", "Hired", "Chief executive") describing the person/scenario in the photo. Auto-advances every 4s; clickable dot indicators at bottom-right allow manual navigation
   - Copy side: eyebrow pill ("Online 24 hours a day, 7 days a week"), H1 ("The world's home for every CV"), supporting paragraph, two CTA buttons ("Add your CV" primary, "Find candidates" secondary/outlined), and a row of three checkmark trust bullets (Free to add your CV / Search worldwide talent / Hire with confidence)

3. **"CVs. One place" section**
   - Centered, narrow (`max-w-4xl`) text block: eyebrow label, H2, two CTA buttons (same pair as hero), and a small icon+text line ("One profile, visible to employers worldwide")

4. **"Why CVONLINE247" section**
   - Two-column card grid (stacks on mobile), one card per audience:
     - **For Employees** card: banner image (`images/banners/1.jpg`), icon, eyebrow, heading "Let the world know what you can do", copy, "Add your CV" button
     - **For Employers** card: banner image (`images/banners/2.jpg`), icon, eyebrow, heading "Save time, money and headache", copy, "Find candidates" button

5. **"Why teams switch to CVONLINE247" comparison section**
   - Eyebrow pill ("COMPARISON"), H2 on the left with a right-aligned supporting line on `lg` and up. Tighter vertical rhythm than its neighbours (`py-12 sm:py-16`) — this section is deliberately compact
   - **No toggle.** Both audiences show at once as two `.cmp-card`s side by side (`grid md:grid-cols-2`), stacking below `md`
   - Each card: cyan `.cmp-eyebrow` ("For employees" / "For employers"), an H3 promise, then a `.cmp-table` of **exactly 5 comparison rows** — claim, a "them" verdict and a CVONLINE247 verdict. Employees compares against *Job boards & LinkedIn*, employers against *Agencies & job boards*
   - The CVONLINE247 column is a rounded, cyan-tinted, outlined column with solid cyan checkmarks. Verdicts are `.compare-mark` circles (check or cross) with `.sr-only` "Yes"/"No" text for screen readers
   - The card tables have no `min-width`, so they always fit — this section never scrolls horizontally at any width

6. **FAQ section** (`#faq`)
   - Two-column on `lg` and up (`minmax(0,360px)` / `minmax(0,1fr)`): eyebrow pill ("FAQ"), H2 and the audience toggle in a `lg:sticky` left column, question cards on the right. Stacks to one column below `lg`
   - The `.seg` toggle — **For Employees** / **For Employers**, defaulting to employers via `data-switch="employers"`. This is now the only place the segmented control is used. Each audience gets its own 6-question set, in cross-faded `.seg-panel`s
   - Accordion cards (`.faq-item`) are navy with a `+` icon when closed; question buttons are set in Inter like every other button; the open card fills solid `accent-glow` (`#00bfff`) with `#09122a` text and the `+` rotates 45° into an `×`. One card open at a time, first card open by default
   - ⚠️ Answers are placeholder marketing copy written against the prototype — several make product claims (blocking named employers from search, hidden contact details, private browsing, shared team shortlists, pricing model) that have not been verified against a real product spec

7. **"How CVONLINE247 works" section**
   - Three-column card grid (stacks to 1 column on mobile), a numbered step each with banner image, step number badge + icon, heading, description, and a "FOR ..." audience tag:
     1. Add your CV (`banners/3.jpg`) — FOR EMPLOYEES
     2. Find candidates (`banners/4.jpg`) — FOR EMPLOYERS
     3. Connect & hire (`banners/5.jpg`) — FOR EVERYONE

8. **CTA / email capture section**
   - Bordered card with subtle vertical gradient (surface → bg), centered heading "Your CV. Online 24/7.", supporting copy, and an inline email + "Get started" submit form (non-functional — no JS handler, no backend)

9. **Footer**
   - **Link columns**: four labelled columns (2-up on phones, 4-up from `md`) — *For Employers* (Search the pool / Start hiring / Employer FAQ), *For Candidates* (Build your profile / Get found / Candidate FAQ), *How it works* (How it works / Why CVONLINE247 / Compare us), *Resources* (Resources / Login / Sign Up). Column headings use `font-heading`, uppercase, tracked-out; links are `text-muted` with a `hover:text-white` transition
   - Half the links resolve to real in-page anchors — `#faq`, plus `#how-it-works`, `#why-us` and `#compare`, ids added to the corresponding `<section>`s for this purpose. The rest are `#` placeholders
   - **Bottom bar** (separated by a `.band` gradient seam): copyright ("© 2026 CVONLINE247. All rights reserved.") with Privacy Policy / Terms of Use links on the left; circular LinkedIn and X icon buttons (`bg-white/5`, `rounded-full`) on the right. Stacks centered below `sm`
   - The social glyphs are the only *filled* SVGs on the page (`fill="currentColor"`, no stroke) — brand marks don't render correctly in the site's usual stroke style. Each anchor carries an `aria-label` since the icons have no visible text

## Interactive Behavior ([script.js](script.js))

- **Hero carousel**: cross-fades between `.slide` elements via Tailwind opacity classes (`opacity-0`/`opacity-100`, `transition-opacity duration-700`). Auto-plays on a 4-second `setInterval`; dot clicks call the same `goTo(index)` function and reset the active dot styling. No pause-on-hover or swipe/touch support.
- **Segmented control** (`initSwitch`, one per `[data-switch]` root — used by the FAQ section only; the comparison section dropped its toggle in favour of two side-by-side cards): switching tabs sets `aria-selected` + roving `tabindex`, toggles `.is-active` on the matching `[data-panel]`, and slides the `.seg-thumb` to the active tab's `offsetLeft`/`offsetWidth` (re-measured on `resize` and after `document.fonts.ready`). ArrowLeft/ArrowRight move between tabs. Both panels sit in the same CSS grid cell (`.seg-stack`), so the section height is fixed to the taller panel and the page never shifts when toggling. Each selection dispatches a `switch:change` CustomEvent on the root so dependent components can react. Transitions collapse under `prefers-reduced-motion`.
- **FAQ accordion** (`initFaq`, one per `[data-faq]` root): clicking a `.faq-q` closes every other card and toggles `.is-open` on its own `.faq-item`, flipping `aria-expanded`. Answers animate open via a `grid-template-rows: 0fr → 1fr` transition (no JS height measurement) and are `visibility: hidden` while closed so screen readers skip them. Native `<button>`s give Enter/Space for free. Listening for `switch:change` on the parent `[data-switch]`, each panel resets to "first card open" when the audience changes, which keeps the two stacked panels close in height.
- **Mobile menu**: hamburger button toggles the `hidden` attribute on `#mobileMenu`. No close-on-outside-click, no close-on-link-click, no icon swap (hamburger doesn't become an X).

## Responsive Behavior

Mobile-first Tailwind breakpoints (`xs` 420px, `sm` 640px, `md` 768px, `lg` 1024px):
- Nav collapses to hamburger below `lg`
- Hero grid, "Why" cards, and "How it works" cards go from multi-column to single/stacked column below `md`/`lg`
- Comparison cards sit side by side above `md` and stack below it. Their tables always fit the card — the verdict column headers shrink to 10px/72px on phones and 11px/120px from `sm` up — so nothing scrolls horizontally
- Font sizes, padding, and gaps scale down at each breakpoint
- Tagline under the logo is hidden below `xs`

## Notable Gaps / Prototype Limitations

- All header nav links (`href="#"`) and most buttons (Login, Sign Up, Browse Candidates, Pricing, Resources) are non-functional placeholders. The footer is the exception — its *How it works* column and the FAQ/Resources links scroll to real sections; the rest (Search the pool, Start hiring, Build your profile, Get found, Login, Sign Up, Privacy Policy, Terms of Use, both social icons) are still placeholders
- "Add your CV" / "Find candidates" buttons appear 5 times across the page but have no click handlers or destinations
- Email capture form has no submit handler or backend endpoint
- No routing, no additional pages — everything lives on this one `index.html`
- Images referenced with a leading `/` (e.g. `/images/banners/1.jpg`) in some places vs. relative (`images/hero/1.jpg`) in others — works when served from root but is inconsistent
- No accessibility affordances on the carousel beyond `alt` text (no `aria-live`, no keyboard control, no pause control for the auto-advance)
