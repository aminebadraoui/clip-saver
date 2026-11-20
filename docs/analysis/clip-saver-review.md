# Clip Saver / ClipCoba — Deep Analysis & Improvement Plan (MNF-362)

Status: read-only analysis. No code changed. No secret values appear in this document (every credential is described, never quoted).
Branch analysed: `mnf-362` (identical content to `dev` HEAD `55bc387`). Repo: 241 tracked files, 100 commits (2025-12-01 → 2026-01-29).

**Method and limits.** Static review of `backend/`, `frontend/src`, `extension/`, root files, plus web research on competitors. I did **not** run the app or take screenshots: running it needs the full backend venv (langchain etc.), a Neon/Supabase DB with real credentials, and creating accounts in a shared DB, and disk is at 95%. All UI/UX findings are therefore from code, not pixels. Anything marked *(unverified)* was not confirmed by running code. Competitor pricing comes from vendor/SEO pages that disagree with each other; re-check before acting on any number.

---

## 0. Executive summary

1. **The product is a YouTube "swipe file → AI script" tool for solo creators.** Save videos/thumbnails/images (extension + web), organise (tags, spaces, moodboards), then run an AI ideation wizard (titles, thumbnails, outline, script). It is a credible niche, and the *save-then-ideate-from-your-own-swipe-file* loop is the only thing that differentiates it.
2. **It is currently losing money and leaking value through its own backend.** Three issues need fixing before any growth work:
   - `POST /api/credits/purchase` hands out credits to any logged-in user with no payment (`backend/routers/credits.py:97-125`).
   - Seven unauthenticated endpoints expose yt-dlp, ffmpeg, the YouTube API quota and Replicate Whisper to the internet (`backend/main.py:289-886`, `routers/transcribe.py`).
   - `POST /billing/debug-activate` gives any user a free "active" subscription (`routers/billing.py:220`).
3. **Secrets hygiene is bad.** JWT signing key hard-coded (`backend/auth.py:12`), a DB password (Supabase pooler URL) committed in `backend/alembic.ini:87`, a ScrapeCreators API key as a fallback literal in `backend/test_scrape.py:7`. All are in git history. **Rotate all three now**; deleting files does not help.
4. **No full rewrite, and no Next.js rewrite now.** The frontend is a competent 16.6k-LOC Vite SPA behind a login; the real problems are paywall/onboarding, mobile shell, token handling and backend authorisation, none of which Next fixes. Next would help only the marketing site (SEO), which is better solved by a separate tiny static/Astro/Next site. Detail in §4.9.
5. **Biggest product risks:** a hard $29/mo paywall straight after sign-up with no trial and no price on the landing page; an ambiguous pricing story (credits exist but are never explained or charged for the AI features users actually use); no mobile navigation; two brand names ("Clip Saver" vs "ClipCoba"/"Clip Coba").
6. **Recommended sequence:** (A) one-week security/abuse stop-the-bleed, (B) two-week activation fix (trial + free tier + onboarding + mobile shell), (C) pick one wedge (§1.9) and cut the rest.

---

## 1. Product discovery & marketing

### 1.1 What it is, who it is for (inferred)

Evidence: landing H1 *"Turn inspiration into viral scripts with AI."* (`frontend/src/pages/LandingPage.tsx:61`), bullets "Bookmark videos instantly / Organize with smart tags / Write viral scripts effortlessly"; Chrome extension that injects a "Clip Coba" button on YouTube watch pages, Shorts and grid thumbnails; "Viral Tracker" (outlier search over YouTube Data API); ideation wizard built around "5 Big Questions" (`models.py:225`); prompts that say "senior creative director".

**Primary persona:** solo/small-team YouTube creator (faceless/educational/commentary), 1k–500k subs, who already browses YouTube daily for ideas, keeps a messy swipe file (Notion, screenshots, browser bookmarks) and struggles with *titles, thumbnails and the first draft*. Secondary: freelance scriptwriters/thumbnail designers and small agencies working for several channels (this is what **Spaces** is really for).

### 1.2 Core value proposition

"Everything you admired on YouTube, in one place, feeding an AI that writes *your* video." The honest version of the promise is **context-aware ideation**: the AI uses saved clips (transcripts, titles, thumbnails) as inputs (`routers/lab.py`, `ideation.py`, `InspirationSidebar`). Generic "viral scripts with AI" is a commodity; "scripts grounded in the 40 videos you saved" is not.

### 1.3 Jobs-to-be-done

| Job | Today's support | Gap |
|---|---|---|
| "Capture that video/thumbnail while I'm browsing" | Extension: 2 clicks min. Web: paste URL (3 actions). | No timestamp/segment capture in extension (`content.js` never reads `currentTime`), no mobile/share-sheet capture, YouTube only. |
| "Find it again by pattern, not by title" | Tags, spaces, moodboards. | No search, no AI auto-tagging, no visual similarity. Frontend has tag filter only. |
| "Understand *why* it worked" | Transcript + AI summary/extraction (lab). | Not surfaced as a first-class "breakdown" card; no outlier score shown in the saved view (field exists on clips). |
| "Turn a pile of refs into a video plan" | Ideation wizard. | Strongest feature, but buried; no start-from-moodboard one-click. |
| "Do this for several channels/clients" | Spaces. | No sharing, no seat model, no client view. |

### 1.4 Competitors (web search, Nov 2026)

| Segment | Players | What they do | Rough price (conflicting sources) |
|---|---|---|---|
| YouTube research/outlier | [1of10](https://1of10.com/blog/1of10-alternatives/), [vidIQ](https://outlierkit.com/blog/1of10-vs-vidiq), ViewStats, OutlierKit | Outlier detection while you browse YouTube, title/thumbnail generators | vidIQ ≈ $19–$89/mo; 1of10 ≈ $19–29/mo + free tier; ViewStats ≈ $49/mo or free tier |
| AI ideation for YouTube | Spotter Studio (**shut public access 22 Oct 2025** per [OutlierKit](https://outlierkit.com/resources/youtube-tool-pricing/)), vidIQ Boost | Ideation + packaging | Spotter was ≈ $49/mo / $299/yr |
| Thumbnail swipe libraries | [ThumbFa.st Inspiration Library](https://v3.thumbfa.st/inspiration-library) (paste URL → saved thumb + AI description of style/palette/mood), 100k-thumbnail databases, free downloaders | Save/browse thumbnails | Free–low |
| Generic moodboard / clipper | [Milanote](https://subger.com/en/service/milanote) (≈ $9.99–12.99/mo), Eagle (≈ $30 one-time), [Raindrop](https://toolradar.com/tools/raindrop/pricing) (free; Pro ≈ $3.5/mo), Are.na, Pinterest, Notion Web Clipper | Save anything, organise visually | $0–$13/mo |

Caveat: almost all comparison pages are written by competitors. Treat "features" as claims.

### 1.5 Positioning gaps and where ClipCoba actually sits

- At **$29/mo** it is priced above vidIQ entry, 1of10 entry, Milanote and 8× Raindrop. It competes with none of them head-on on features: it has no channel analytics (vidIQ/ViewStats), no browse-time outlier overlay (1of10), and less visual polish than Milanote.
- **Empty niche:** "swipe file *that writes*." Raindrop/Eagle/Milanote save but don't generate; vidIQ/1of10 generate from *their* data, not *your* curated references; Spotter (the closest idea) just shut its doors, which is both a warning (hard market) and an opening (its users are looking).
- Gap in the market is **personal-reference-grounded ideation for YouTube**. The current landing page doesn't say that; it says generic "viral scripts with AI."

### 1.6 Pricing & credits critique

Facts: one plan, **$29/month** shown only on `SubscriptionPage.tsx:96-132` *after* sign-up ("Unlimited Clips", "Viral Tracker Access", "Advanced Ideation Tools"). No annual, no trial copy (code accepts `trialing`, `auth.py:80`), no free tier. All app routes sit behind `SubscriptionGuard` (`App.tsx:27-40`). Separately, a **credit system** exists: `User.credit_balance` default **100** (`models.py:36`), packages $5/100 … $150/5000+1000 bonus (`credits.py:36-41`), workflow runs deduct credits (comment: $0.05/credit), `calculate_total_cost` defaults unknown models to 10 credits.

Problems:
1. **Two meters, no story.** Subscribers get "unlimited" everything, yet AI cost (Gemini 3 Pro via Replicate; image/video models in workflows) is real. Ideation/lab/transcribe/Whisper **charge nothing** (`ai_agent.py` has no deduction anywhere). The only thing metered is the *hidden* workflows feature (not even in the prod sidebar), and the credit-purchase endpoint is free (§4.3). Margin per heavy user is unbounded.
2. **Hard wall before value.** User registers, lands on a paywall, sees $29, has never seen the product. Typical SaaS conversion from cold paywall without trial is low; the page also has hard-coded gray/black styling that looks like a different app.
3. **Price shown nowhere pre-signup** (landing has no pricing section).
4. **Pro copy undersells** (omits moodboards, sparks, extension, transcripts) and refers to "Viral Tracker" which has **no sidebar link** and burns the YouTube quota (§4.6).
5. **Credits users can't buy honestly** (placeholder) and don't know they have (100 at sign-up, never mentioned).

Recommendation: **Free tier (e.g. 25 saved clips + 3 ideations/mo) → Pro $12–15/mo with AI credits included (e.g. 300/mo) → top-up packs via real Stripe.** Annual at ~2 months free. Keep "Agency" ($39–49, 3 spaces + seats) as the Spaces upsell. Run a 7-day trial for card-on-file. Everything AI-metered through one ledger.

### 1.7 Onboarding & activation

Current: Register → `/dashboard` → paywall → (after paying) empty grid with text "No videos found / Get started by adding your first video." and **no button** (`ClipsPage.tsx:451-459`). No tour, no checklist, no extension install prompt, no sample data. Post-save from `/create` navigates to `/` which is the **marketing landing page** (`CreateClipPage.tsx:121,129`).

Define activation as **"saved ≥5 clips and ran ≥1 ideation within 48 h."** Fix: (a) landing → register → *product first*, paywall later; (b) first-run checklist: install extension → save 3 videos (pre-seeded suggestions) → run one ideation from them; (c) empty states with CTAs; (d) email day-1/day-3 nudges; (e) fix the `/` redirect bug.

### 1.8 Growth loops

| Loop | Status | Idea |
|---|---|---|
| Extension (acquisition + habit) | Built; v1.3.0, **web store zip stale (v1.0)**; YouTube only | Publish on CWS with 3 screenshots + privacy policy; in-YouTube "Save to ClipCoba" is the best ad you have. Add "Open in ClipCoba" results. |
| Sharing | Absent (workflows have `is_public` flag but nothing public) | Public read-only moodboard URLs ("my thumbnail swipe file") with "made with ClipCoba" footer. Cheapest viral surface. |
| Spaces | Single-user only | Invite client/editor to a space → seat revenue + referral. |
| Content/SEO | Marketing site is one 150-LOC page, `<title>ClipCoba</title>` only | Programmatic pages ("best thumbnails in <niche>") need SSR/static: this is the one legitimate Next/Astro use. |
| Outlier Tracker | Built, hidden, quota-hungry | Make it the free lead magnet (cached daily niche outliers), gate saving/AI behind sign-up. |

### 1.9 Three sharpest wedge ideas

1. **"Swipe file that writes" (recommended).** Landing promise: *"Save 20 videos you love. Get 10 titles, 5 thumbnail concepts and a first-draft script in the same style."* One-click "Create from moodboard" in the app; extension adds a "Remix this" button. Direct competitors: none exactly. Sits in Spotter's vacated space.
2. **Thumbnail & title pattern library for packaging-obsessed creators.** Auto-tag every saved thumbnail with AI (style, text, face, palette, as ThumbFa.st does), searchable and moodboard-able; generate title+thumb *pairs* from your library. Smaller scope, fastest to build on existing tags + images + Gemini.
3. **Agency/client reference boards for editors and thumbnail designers.** Spaces + public board links + comments/approval. Per-seat pricing, B2B, lower churn. Needs sharing infra but monetises the existing Spaces model better than solo plans.

Pick **1**, build **2** as its engine, keep **3** as the paid-upgrade path.

### 1.10 Landing page & messaging recommendations

- **Name:** pick one. Repo/package says "Clip Saver", UI says "ClipCoba", subscription page says "Clip Coba Pro", extension "Clip Coba". Choose ClipCoba everywhere (domain is `clipcoba.com`) and rename repo/docs.
- **Headline** (replace generic AI claim): *"Your YouTube swipe file, turned into your next video."* Sub: *"Save videos and thumbnails in one click. ClipCoba writes titles, thumbnails ideas and scripts from what you saved."*
- Add: 20-second looped demo of extension → board → script; 3-step "How it works"; pricing section with free tier; FAQ ("Does this download videos?" "Is this allowed?"); testimonials as soon as there are any; proper `<title>`, meta description, OG image.
- Remove "Distraction-free script writing" / "Smart tags" filler (everyone says that); say *what it makes*.
- CTA: "Start free" not "Start Creating" (which currently hits a paywall).
- Legal/trust: privacy policy exists (97 LOC); add terms, plus a clear "we store links/thumbnails, not videos" line (the backend does yt-dlp downloads into a public `/temp`, see §4.3, which is a copyright and abuse problem if left public).

### 1.11 Retention risks

- **Value is back-loaded:** swipe files only pay off after ~20+ saves; without prompts users churn before that.
- **Habit lives in a Chrome extension on one site;** no mobile capture, no Shorts timestamps, silent failure paths (transcript regex scraping).
- **$29/mo for a tool used in weekly bursts** (planning day) invites monthly cancels. Annual plan and usage-based credits help.
- **Hidden/unfinished features erode trust** (Viral Tracker with no link, workflows hidden in prod, dead cancel-at-period-end banner so users never see "ends on…").
- **Reliability:** AI runs on one provider route (Gemini 3 Pro via Replicate) with no retries on the async path; a failed job just shows an error.
- **YouTube-dependency risk:** DOM scraping and yt-dlp can break any week; Spotter's shutdown shows how fragile this category is.

---

## 2. UI/UX review (code-based)

*(No screenshots; see method note. 390/1440 and light/dark verified only by reading CSS classes.)*

### 2.1 Screen inventory (`frontend/src/App.tsx:44-90`, 125 files, ~16.6k LOC)

| Route | LOC | Purpose | Notes |
|---|---|---|---|
| `/` LandingPage | 150 | Marketing | One screen, no pricing/demo/social proof. |
| `/login`, `/register` | 142 / 174 | Auth | Public-only guards. |
| `/dashboard` ClipsPage | 511 | Video grid/list, tag filter, "Add Video" popover, trash | Skeletons present; empty state has no CTA. |
| `/create` CreateClipPage | 198 | URL → preview → SaveClipModal | Post-save redirect bug to `/`. |
| `/clip/:id` ViewClipPage | 617 | Player, segments, thumbnail capture, downloads | Largest page; mixes concerns. |
| `/ideation` IdeationPage | 393 | Wizard (idea → titles → thumbs → outline → script) | Core value, 371-LOC inspiration sidebar. |
| `/moodboards`, `/:id` | 231 / 334 | Boards of images/clips/sparks | `confirm()` for delete. |
| `/sparks`, `/sparks/:id` | 45 / 47 | Quick-capture notes (tiptap, slash commands, audio recorder) | Newest feature; Whisper transcription unauthenticated server-side. |
| `/library/:type` | 185 | Saved titles/thumbnails/scripts | |
| `/workflows`, `/:id/edit` | 181 / 649 | Node-graph AI (reactflow) | Sidebar link hidden outside `DEV`; routes still live in prod. |
| `/viral-tracker` | 133 | Outlier search | **No sidebar link.** |
| `/settings`, `/subscription` | 113 / 169 | Account, billing | Paywall page re-used inside Layout. |
| `/privacy-policy` | 97 | Legal | |
| *no catch-all* | — | | Unknown URL renders blank. |

### 2.2 Navigation & hierarchy

- `Layout.tsx` = fixed left sidebar + content; no top bar. Sidebar is **16 px icon rail that expands on CSS `:hover`** (`Sidebar.tsx:~27`). Consequences: labels invisible until hover; **Spaces switcher exists only in the expanded state** (opacity-0 until hover) so the key multi-tenant control is hidden; unusable on touch.
- No `aria-label`/tooltip on icon-only buttons; links wrap `<Button>` (`<a><button>` nesting) → invalid HTML, double tab stops.
- IA mixes *assets* (Videos, Moodboards, Libraries), *tools* (Ideation, Sparks, Workflows) and *discovery* (Viral Tracker, unlinked). A clearer model: **Save → Organise → Create** (Library | Boards | Create), with Sparks as global quick-capture (it already has a floating button).
- Each route wraps its own `<Layout>` which wraps `AppDataProvider`, so app-data context remounts per navigation *(unverified refetch cost)*.

### 2.3 Mobile (390 px)

No hamburger, drawer or `useIsMobile`; the 64 px rail is always on at 390 px (≈16% of width), and hover-expand does nothing on touch. Individual pages have some responsive grids (`ClipsPage` 1/2/4 columns; Landing `lg:grid-cols-2`), but the **app shell is desktop-only**. Rating: weak. Fix: bottom tab bar (Videos / Boards / Create / Sparks / More) under `md`, spaces in a sheet.

### 2.4 Theme & consistency

- **Dark only.** `tailwind darkMode: ["class"]` is configured but nothing ever sets `.dark`; `index.css:6-12,46` defines the same YouTube-red dark vars in `:root` and `.dark`. No light mode or toggle (competitive tools like Notion/Milanote default light; many creators work in light). Fix is cheap if tokens are used; **they often aren't**: hard-coded `bg-[#0f0f0f]` (Sidebar), `bg-neutral-800`, `text-gray-400`, `#FF0000` (`SubscriptionPage.tsx:96-132`).
- shadcn/Radix present (dialog, sheet, tabs, tooltip…), but many pages use raw `<select>`/`<input>` and hand-rolled popovers (the "Add Video" popover at `ClipsPage.tsx:226-262` has a backdrop div, no focus trap, no Esc).
- **Mixed feedback patterns:** 10 native `alert()`/`confirm()` calls (`AppDataContext.tsx:131`, `RightSidebar.tsx:47,54`, `MoodboardsPage.tsx:93`, `LibraryPage.tsx:81`, `MoodboardDetailPage.tsx:75`, `WorkflowsPage.tsx:28,34,43`, `SettingsPage.tsx:54`) while a `ConfirmModal` exists (used only by WorkflowEditorPage) and `sonner` toasts are used elsewhere.
- Montserrat loaded through a render-blocking Google Fonts `@import`.
- Duplicate `workflowTemplates.ts` (`utils/` 106 LOC and `components/workflow/` 282 LOC).

### 2.4a Empty / loading / error states

| Screen | Loading | Empty | Error |
|---|---|---|---|
| ClipsPage | skeletons (`:426-449`) | text only, **no CTA** (`:451-459`) | toasts |
| CreateClipPage | yes | n/a | inline (`:23`) |
| ViewClipPage | yes | **none / no not-found** | 14 catch sites |
| Ideation / Library / Moodboards / Workflows / Viral | yes | basic | mixed |
| Settings, Sparks | thin | none | `alert()` |
| App-wide | — | — | **No React ErrorBoundary, no 404 route** |

### 2.5 Save-clip flow friction

- **Extension:** click "Clip Coba" button → dropdown (space, tag chips, new tag) → "Send to Clip Coba" = **2 clicks minimum** (good). Error text is truncated to 30 chars (`content.js`), a missing paywall message (non-subscribers get a raw API error since `/api/clips` POST requires `get_active_subscriber`), and polling the DOM every 2 s forever (`setInterval(injectAll, 2000)`).
- **Web dashboard popover:** 3 actions (good), duplicate detection (good).
- **`/create` page:** paste → Fetch → preview → Save → modal → "Save Clips" = ~5 steps, then dumped on the **marketing page**.
- **Image save from extension:** icon → pick images → space → moodboard → Save ≈ 5+ clicks; popup uses raw fetch with no token refresh (a page re-sync is needed after expiry).
- **No timestamp/segment capture on save** even though the changelog promises it; segments are authored later in ViewClipPage.

### 2.6 Accessibility

~2 `aria-*`/`role=` attributes across the whole `src`; 3 `sr-only`; 21 `<img>`/21 `alt=` (quality unchecked). Icon-only nav without names; custom overlays (`NodeSettingsPanel`, Add Video popover) lack focus trapping; Radix dialogs are fine. Contrast risks: `text-gray-500`/`text-xs` on near-black, red on near-black. Not measured with a tool *(unverified)*. Target WCAG 2.1 AA; first pass: names on icon buttons, focus rings, `aria-live` for toasts, run axe in CI.

### 2.7 Other UX bugs worth a ticket

- `utils/creditsApi.ts:29`, `utils/replicateApi.ts:18`, `editor/extensions/AudioRecorderNode.tsx:61` read localStorage key `'token'`, but login stores `clipcoba_token` → these calls go out **unauthenticated** *(high confidence from code; not run)*: credits balance, model list and audio transcription likely 401 for everyone.
- `SubscriptionBanner.tsx` (cancel-at-period-end warning) is never imported: users who cancel never see when access ends.
- `config.ts:19` logs the API URL in production; ~86 `console.*` calls.
- Failed refresh does `window.location.href='/'` (hard reload to marketing page).

---

## 3. Product review

### 3.1 Feature inventory and health

| Feature | Backend | Frontend | Health | Verdict |
|---|---|---|---|---|
| Clips (save, trash, notes, transcripts) | `main.py` clips, `Clip`, `Note` | ClipsPage, ViewClipPage, extension | **Core, working.** `Note` API has no FE caller found. | Double down |
| Tags | `tags.py` | filter chips, modal | Basic; no search/auto-tag | Improve (AI auto-tag) |
| Spaces | `spaces.py`, `dependencies.py` | SpaceSwitcher | Ownership checks correct (`get_current_space` scopes by user). Hidden UX. | Keep; surface; seats later |
| Sparks | `sparks.py` | tiptap editor, store | Clean, ownership OK. Newest. | Keep; fold into Ideation inbox |
| Moodboards | `moodboards.py` | 2 pages | Works; IDOR gaps (§4.4); `IdeationMoodboardLink` model has no router. | Double down |
| Images | `images.py` | modal, extension gallery | Works; N+1 tag loops | Keep |
| Ideation | `ideation.py`, `ai_agent.py` | 393-LOC wizard + sidebar | **Core value**; async + webhook pattern documented in `docs/replicate_architecture.md`. Not metered. | Double down; meter |
| Lab (extract/summary/templates) | `lab.py` | ViewClipPage, Library | Works; **IDOR on 7 call sites**; costs ScrapeCreators + Replicate per call; unmetered | Keep; fix + meter |
| Library (title/thumbnail/script templates) | `lab.py` + 3 link tables | LibraryPage | OK | Keep |
| Viral Tracker | `main.py:439-600` | ViralTrackerPage | No nav link; no auth; ~400+ YT quota units/call | Fix or hide; potential lead magnet |
| Workflows (node-graph) | `workflows.py`, `workflow_executions.py`, `workflow_engine.py` | reactflow editor (649 LOC) | Prod-hidden; synchronous execution in request; cancel/SSE effectively dead; credits only here | **Cut from MVP / feature-flag off** until wedge decided |
| Transcribe (Whisper) | `transcribe.py` | AudioRecorderNode | Unauthenticated; FE sends wrong token key | Fix auth; meter |
| Replicate models cache | `replicate_models.py` | replicateApi | Any user can trigger refresh ("TODO admin") | Admin-only |
| Credits | `credits.py`, `credit_service.py` | CreditBalance (112 LOC) | **Free purchase endpoint**; no concurrency safety; FE auth bug | Rebuild properly |
| Billing (Stripe) | `billing.py` | SubscriptionPage, Settings | Works for one plan; has `debug-activate` backdoor | Harden |
| Thumbnail capture (`/api/capture-thumbnail`) | yt-dlp+ffmpeg subprocess | SegmentBuilder | Unauthenticated; CPU/disk heavy | Auth + queue or cut |
| Download (`/api/download`) | yt-dlp → public `/temp` | ViewClipPage | Unauthenticated, publicly served files, ToS risk | Cut or heavily restrict |

### 3.2 Half-built / dead

- **`director*` tables: do not exist.** No model, migration, route or frontend reference (only the phrase "creative director" in prompts at `ai_agent.py:35,163` and `workflowTemplates.ts:62,190`). The owner's checklist item is stale; nothing to remove.
- **"WIP workflows":** the workflow system is ~1,500 LOC backend + ~2,100 LOC frontend (editor 649, nodeConfig 692, templates 282+106, api 238). Implemented node types in `workflow_engine.py`: input/media_input, utility (concat only), replicate/inpaint/remove_bg/llm_model, mask_editor, transform (select_first only), output. Execution is synchronous inside the HTTP request (`workflow_executions.py:88-100`); `replicate.run` has no timeout; `DELETE` cancel only flips a status; `run_prediction_async/get_prediction_status/cancel_prediction` unused.
- **Dead code:** `SubscriptionBanner.tsx`, `backend/index.ts` (stray Express file), `main.py` commented YouTube client, routers registered twice (`main.py:130-144` and `:1010-1014`), `Note` endpoints, `IdeationMoodboardLink`, `initial_fetch_target`-style viral logic with no cache, duplicate `workflowTemplates`, unused `contextMenus`/`notifications` extension perms.

### 3.3 Cut / double down

**Cut or feature-flag off now:** Workflows editor (+ credits-by-run), `/api/download`, hover thumbnails capture via server-side yt-dlp (replace with client-side thumbnail URL + timestamp), Viral Tracker (until cached), `Note` API, replicate-model refresh endpoint.
**Double down:** Extension (publish, polish, multi-site), moodboards, ideation-from-references, transcripts+summaries as "breakdown," Spaces for agencies, sharing.

### 3.4 Roadmap (product)

- **Now (weeks 1-2):** security + paywall/trial + onboarding + brand + mobile shell.
- **Next (weeks 3-8):** wedge #1 ("Create from moodboard"), AI auto-tag + search, public boards, metered AI credits, CWS launch.
- **Later (quarter):** agency seats/comments (wedge #3), TikTok/Instagram/Reels capture, thumbnail pattern analytics, optional workflows revival as "Pro lab" if usage justifies.

---

## 4. Technical review

### 4.1 Architecture

```
Chrome ext (MV3) ──► api.clipcoba.com (FastAPI, uvicorn, Coolify/Traefik) ──► Postgres (Supabase pooler per alembic.ini; Neon per owner)
   │  content.js (YouTube DOM scrape)           │  main.py 1,254 LOC (auth, clips, YT, yt-dlp, ffmpeg)
   │  auth-sync.js (copies web localStorage)    │  routers/ 15 modules, services/ 3, ai_agent.py 1,045 LOC
React 19 + Vite 5 SPA (clipcoba.com) ────────────┤  Replicate (Gemini 3 Pro, image/video models, Whisper)
   │  Context + 1 zustand store, raw fetch      │  Stripe (checkout, webhook, portal)
   │  localStorage tokens                       │  ScrapeCreators (transcripts), YouTube Data API v3
```

- **Backend** (~7.7k Python LOC): FastAPI + SQLModel, one giant `main.py` mixing auth, clips, YouTube scraping, ffmpeg and temp-file serving. 15 routers. Blocking SDK/HTTP calls inside `async def` handlers (`lab.py`, `transcribe.py`) block the event loop.
- **Frontend:** Vite SPA, TS `strict: true`, 79 `any`, shadcn/Radix + Tailwind, reactflow, tiptap, three video player libs, **no code-splitting** (all 18 pages statically imported, so landing visitors download the workflow editor), **no tests**, no data-fetch layer (raw `fetch` scattered across `utils/*Api.ts`; token key drift).
- **Extension:** MV3, 666-LOC `content.js`, 442-LOC `popup.js`; host permission only `api.clipcoba.com`; API base hard-coded (localhost toggle by editing source).

### 4.2 Data model

24 tables (`models.py`): `User` (+ Stripe fields, `credit_balance`), `RefreshToken`, `Space`, `Clip`, `Tag`, `Note`, `Moodboard` (+ clip/spark link tables), `Image`, `VideoIdeation` (+ moodboard link), `Spark`, `AIWorkflow`, `WorkflowExecution`, `CreditTransaction`, `ReplicateModelCache`, `AsyncJob`, `TitleTemplate`/`ThumbnailTemplate`/`ScriptTemplate` (+ 3 clip links).
Observations:
- **JSON-as-text columns** (`brainstormedTitles`, `workflow_data`, ...) and mixed `camelCase`/`snake_case` columns, with `createdAt` ints in epoch ms. Duplicate field line `space_id` declared twice in `VideoIdeation` (`models.py:~248`).
- `user_id` is **nullable** on most tables (Clip? Spark, Ideation, Workflow). An orphan row is invisible *and* cannot be cleaned by ownership checks.
- **Credits are a mutable integer + append-only log with no locking**; `deduct_credits` does `balance -= amount` after a prior read; two concurrent runs can overspend (`credit_service.py`). Use `SELECT … FOR UPDATE` or an atomic `UPDATE … WHERE balance >= :n`.
- No indexes declared beyond PK/`email`/`stripe_customer_id`/`token_hash`; `clips.user_id`, `space_id` queries scan. At current scale fine; will not be.
- `create_all` on startup **and** alembic (16 revisions incl. a "verify_schema_sync" no-op) → two sources of truth; plus `fix_db*.py` scripts that patch schema by hand.
- Clips list (`/api/clips`) returns every clip with tags and notes, no pagination.

### 4.3 Auth, billing, security (ranked)

**Critical (exploitable today)**

| # | Issue | Where | Impact |
|---|---|---|---|
| S1 | Free credits: `/api/credits/purchase` adds credits for any package, no payment | `routers/credits.py:97-125` | Unlimited Replicate spend per account |
| S2 | Free subscription: `/billing/debug-activate` sets `active` for any user | `routers/billing.py:220-229` (+ called in dev UI `SubscriptionPage.tsx:150`, `create_tester.sh`) | $29/mo bypass, plus clips gated by this flag. Anyone can call it on prod. |
| S3 | JWT signing key hard-coded in source | `backend/auth.py:12` (comment even says "should be in env") | Anyone with repo access can mint a token for any email; token = full account takeover. Rotate, move to env, invalidate all sessions. |
| S4 | Unauthenticated expensive endpoints | `main.py`: `/api/info`, `/api/download`, `/api/download/progress/{id}`, `/api/youtube/viral`, `/api/youtube/trending-keywords`, `/api/capture-thumbnail`, `/api/cleanup`; `routers/transcribe.py` (Replicate Whisper) | Free yt-dlp/ffmpeg/Whisper for the internet; CPU/disk DoS; exhausts 10k/day YouTube quota in ≈ 20 viral calls; `/temp` is a public static mount of downloaded videos. |
| S5 | IDOR in Lab: `session.get(Clip, request.clipId)` with no owner check | `routers/lab.py:32,60,124,161,367,409,424` | Read/overwrite another user's transcript/notes by UUID; force spend. |
| S6 | Moodboard link IDOR: `POST /{id}/clips`, `/{id}/sparks` don't check clip/spark owner; `GET /{id}/clips` returns the linked clips | `routers/moodboards.py:174,230,261` | Read any clip by UUID |
| S7 | Replicate webhook has no signature verification | `routers/webhooks.py` | Forge job output/status if a prediction id is known |
| S8 | Stripe webhook prints a signature prefix and if `Stripe-Signature` header absent → `None[:10]` 500; no idempotency; only subscription events handled; no `invoice.payment_failed` | `billing.py:~236` | Operational, not exploit |

**Secrets in git (rotate, then purge history if repo is ever opened up)**

| Item | Location | Action |
|---|---|---|
| JWT secret | `backend/auth.py:12` | Rotate → env var; add startup check |
| DB password in Supabase pooler URL | `backend/alembic.ini:87` (history: commit `3810540`) | **Rotate DB password**, read URL from env in `alembic/env.py` |
| ScrapeCreators API key fallback literal | `backend/test_scrape.py:7` | **Rotate key**, delete file |
| Personal email default | `unlock_prod_subscription.py:6` | Delete file |
| `stripe.tar.gz` (8 MB; contains the Stripe CLI Mach-O arm64 binary, 30 MB unpacked, dated Dec 2025) | repo root, added with "implement payment" commits | No secret inside (verified by listing), but a vendor binary in git; delete + `.gitignore` already lists `stripe` yet the tarball slipped through |
| `extension.zip` (667 KB, **v1.0 stale**: missing `background.js`, old `content.js` 472 vs 666 LOC, `__MACOSX` junk) | repo root | Delete; build from source in CI |
| `echo=True` on SQLAlchemy engine | `database.py:14` | Logs every SQL statement incl. parameters (emails/hashes) in prod |

Pattern search of all tracked files at HEAD found no Stripe `sk_*`/`whsec_*`, Replicate `r8_*` or Neon `npg_*` tokens beyond the three items above. **Git history was NOT scanned** (only `alembic.ini` was traced to commit `3810540`); run gitleaks/trufflehog over all 196 refs-commits before closing this item, and assume the JWT key, DB password and ScrapeCreators key are compromised.

**High / Medium**

- **Tokens:** access JWT 7 days (`auth.py:14`), refresh 30 days, refresh tokens never rotated or revoked on use, never deleted; `datetime.utcnow()`; SSE stream passes JWT in query string (`workflowApi.ts:170`) → tokens in access logs; localStorage storage (XSS-readable). The extension copies the same tokens into `chrome.storage.local` every 5 s.
- **Registration:** no email validation/verification, no password policy, no rate limiting/lockout, no captcha → signup farming × (100 free credits + free purchase endpoint).
- **CORS:** explicit origins + `allow_credentials=True`; no extension origin (fine, extension uses Bearer), `allow_methods/headers *`. `ProxyHeadersMiddleware(trusted_hosts="*")` trusts any `X-Forwarded-*`.
- **Billing:** `/api/clips` etc. gate on `subscription_status in (active, trialing)`, but `past_due`/`unpaid` get no grace. `/billing/sync` trusts Stripe (fine). Credit packages never go through Stripe. Subscription webhooks keyed on `stripe_customer_id`; `debug-activate` writes a fake customer id `"debug_customer_id"` which later Stripe events will never match.
- **SSRF/DoS:** `replicate_service` downloads arbitrary `image_input` URLs with `urlretrieve` (no timeout/size/host checks); `/api/info`/yt-dlp take user-influenced IDs.
- **Extension:** `popup.js:285-288` builds `<img src="${img.src}" alt="${img.alt}">` via `innerHTML` from third-party page data (attribute injection; MV3 CSP mitigates inline handlers; use `createElement`). Unused permissions `contextMenus`, `notifications`; `scripting` still present while changelog says removed. Reads clipcoba localStorage only on `clipcoba.com` hosts (good scope).

### 4.4 Authorisation sweep summary

Properly owner-scoped: sparks, ideation, jobs, workflows (except public-run semantics), images (except `moodboard_id` target), tags, spaces, clips PUT/DELETE, `get_current_space`. Broken: lab (7 sites), moodboard linking (2). Public workflows can be executed by any user, spending the *executor's* credits only (fine) but exposing the owner's node config.

### 4.5 Code quality

- **No automated tests.** No `tests/`, no pytest in `requirements.txt`, no conftest, no frontend runner (no vitest/jest, no `test` script), no CI. `TESTING.md` (12.9 KB) describes manual steps. The `backend/test_*.py` files (`test_ai_models.py`, `test_ideation_ai.py`, `test_ideation_e2e.py`, `test_replicate.py`, `test_scrape.py`, `test_transcript.py`, `test_filename.py`, `test_fix.py`) are ad-hoc scripts that need a running server on `:8000` or live paid APIs; if anyone adds pytest they will spend money.
- **Root/debug clutter (delete or move to `scripts/`):** `debug_env.py`, `debug_env_check.py`, `debug_startup.py`, `debug_portal_session.py`, `check_db.py`, `verify_db.py`, `verify_schema_simple.py`, `fix_db.py`, `fix_db_ideation.py`, `fix_db_schema.py`, `fix_legacy_ideations.py`, `cleanup_duplicates.py`, `migrate_user_data.py`, `data_uri_helper.py`(verify use), `test_extraction.js`, `index.ts`, `syntax_check.py`, `create_tester.sh`, `unlock_prod_subscription.py`, `README.md` (Vite template boilerplate in the frontend; root README ≈ stock).
- **Structure:** `main.py` 1,254 LOC; `ai_agent.py` 1,045 LOC with 16 near-identical Replicate call functions each re-reading `REPLICATE_API_TOKEN`; routers double-included; `print()` instead of logging (`DEBUG:` prints in prod paths); `echo=True`.
- **Frontend:** 79 `any`, ~86 `console.*`, 10 native dialogs, 3 files > 600 LOC (`nodeConfig.ts` 692, `WorkflowEditorPage` 649, `ViewClipPage` 617), no error boundary, no 404.

### 4.6 AI / Replicate / external API cost risks

| Source | Usage | Control today | Risk |
|---|---|---|---|
| Replicate `google/gemini-3-pro` | 16 call sites in `ai_agent.py` (titles temp 0.3–0.8, outline, script, extract, summary). Async variant with webhook (`predictions.async_create`) for ideation; sync `replicate.run` for lab. | **No credit deduction, no rate limit, no `max_tokens`**; transcript truncated to 15 000/10 000 chars on some paths only; retries only on rate-limit errors in sync paths; client timeout 300 s | Unbounded cost per subscriber; a user pasting huge text or scripting the API burns margin |
| Replicate image/video models (flux-1.1-pro/ultra, sdxl, imagen-4, ideogram, recraft, video) | Workflows only; `cost_per_run` credits, comment ≈ $0.05/credit; unknown models default to **10 credits** | Pre-check at estimate, deduct **after** success (race → free outputs); failures refund-no-op (nothing charged, partial spend absorbed) | Moderate; hidden feature in prod but reachable by URL/API |
| Replicate Whisper (`incredibly-fast-whisper`) | `/api/transcribe` | **None, unauthenticated** | Direct cost leak |
| ScrapeCreators transcripts | `lab.py` (+ cached in `Clip.transcript`) | Cache only | Per-call paid, no per-user limit |
| YouTube Data API | `/api/info` (≈2 units), `/api/youtube/viral` (`search.list` = 100 units × ≥4 pages + list calls), no auth, no cache | None | 10 000 units/day default quota exhausted by ~20 calls; also breaks extension `/api/info` |
| yt-dlp/ffmpeg on the API box | download, capture-thumbnail | None | CPU/disk/egress DoS; ToS exposure |

Unit-economics guess: if a typical ideation run is ~5 Gemini calls (~$0.02–0.10 each *(unverified; check Replicate dashboard)*), a power user running 100 ideations/mo costs $10–50, i.e. up to 170% of the $29 price with zero metering. Pull 30 days of Replicate spend per user from the dashboard before pricing.

### 4.7 Deployment

- Coolify on a self-hosted server behind Traefik (`ProxyHeadersMiddleware` comment). `backend/build.sh` downloads a static ffmpeg at build time (evermeet/johnvansickle, **unpinned and unchecksummed**) and creates a venv; `start.sh` runs `uvicorn main:app` (single process, no `--workers`, no gunicorn, no healthcheck). No Dockerfile/compose/CI/IaC in repo, so builds are not reproducible from git.
- Frontend: Vite build, `VITE_API_URL` falls back to `http://localhost:3001` if unset (a mis-configured prod build silently talks to localhost); scripts and `config.ts` upgrade http→https.
- Env vars (names only): `DATABASE_URL`, `REPLICATE_API_TOKEN`, `REPLICATE_WEBHOOK_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`, `YOUTUBE_API_KEY`, `SCRAPECREATORS_API_KEY`. `SECRET_KEY` is missing from this list because it is hard-coded.
- Downloaded videos live in local `TEMP_DIR` on the API box, publicly served, with no TTL job (cleanup is a manual unauthenticated endpoint).
- DB: `create_engine(DATABASE_URL, echo=True)` with default pool, no `pool_pre_ping` (important behind Supabase/Neon poolers that drop idle connections), no statement timeout.
- Observability: `print()` only. No Sentry (Sentry MCP is available to the owner; use it), no uptime check, no structured logs.

### 4.8 Performance

- Blocking calls in `async def` (lab, transcribe, `/api/info` pieces) stall the event loop; with single uvicorn worker one slow Gemini call can freeze all users.
- Workflow execution inside the request; long image/video generations will hit proxy timeouts.
- `/api/clips` unpaginated, N+1 patterns (`images.py` tag-link loops, moodboard delete loops, clip tagIds/notes assembly in Python).
- Frontend bundle includes reactflow 11, tiptap (5 pkgs), three video players, react-markdown for every route; landing visitors pay for all of it. External Google Font `@import` blocks first paint.
- Extension: `setInterval(injectAll, 2000)` + MutationObserver on `document.body` on every YouTube tab.

### 4.9 The Next.js question

**Answer: no full rewrite now.** Evidence:

- Frontend is a behind-login SPA with 18 routes; **no SSR/SEO requirement exists for the app itself**. Nothing in §2/§4 (paywall, mobile shell, token drift, a11y, tests, code-splitting) is caused by Vite/React Router, and none is fixed by migrating.
- Backend (FastAPI + Python AI libs) would stay regardless; Next wouldn't replace it, so you'd carry two server stacks.
- A rewrite costs 3–6 weeks to restore *current* parity while the revenue-affecting bugs sit untouched.

What Next **would** buy: SEO + fast first paint for the marketing site and programmatic pages (niche/outlier galleries, public boards), image optimisation, route-level code splitting by default, server-side OG tags for shared boards, simpler cookie (httpOnly) sessions via route handlers.
What it **would not** buy: fixes for authorization/billing/credit bugs, mobile nav, tests, onboarding, lower AI cost, extension reliability.
Cheaper path to the same upside: (1) `React.lazy` per route + `vite build --analyze`, (2) a **separate** marketing site (Astro or Next, static) on `clipcoba.com` and the app on `app.clipcoba.com` (this also lets you set `SameSite`/httpOnly cookie auth cleanly), (3) public board pages rendered server-side by FastAPI+Jinja or the marketing site. Revisit Next for the *app* only if SEO'd public content becomes the growth engine.

---

## 5. Ranked improvement plan

Effort: S ≤ 0.5 day, M ≈ 1–3 days, L ≈ 1–2 weeks, XL > 2 weeks (one engineer). Impact: ★ to ★★★★★.

### 5.1 Stop-the-bleed (this week, before anything else)

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Remove `/billing/debug-activate` (and the FE dev button, `create_tester.sh`, `unlock_prod_subscription.py`) | S | ★★★★★ |
| 2 | Disable `/api/credits/purchase` (return 501) until real Stripe Checkout (mode=payment) + webhook credit grant exists | S | ★★★★★ |
| 3 | Rotate JWT secret → env var with fail-fast; accept that all sessions end; rotate DB password, ScrapeCreators key; remove literals from `alembic.ini`, `test_scrape.py` | S–M | ★★★★★ |
| 4 | Add auth (`get_current_user` + subscriber) to `/api/info` (extension sends Bearer anyway), `/api/download*`, `/api/capture-thumbnail`, `/api/cleanup`, `/api/youtube/*`, `/api/transcribe`; or turn off download/capture/cleanup altogether and delete `/temp` mount | S–M | ★★★★★ |
| 5 | Fix IDORs: `lab.py` ×7 (`Clip.user_id == current_user.id`), moodboard link endpoints (verify clip/spark owner), images `moodboard_id` | S–M | ★★★★★ |
| 6 | Verify Replicate webhook (HMAC signing secret) or at least a secret path token | S | ★★★ |
| 7 | `database.py`: `echo=False`, `pool_pre_ping=True`; set uvicorn workers ≥2 | S | ★★★ |
| 8 | Admin-gate `/api/replicate/models/refresh`; add per-user rate limiting on AI endpoints (slowapi/Redis) | S–M | ★★★ |
| 9 | Delete `stripe.tar.gz`, `extension.zip`, root debug/fix scripts; add `.gitignore` entries; run gitleaks across history | S | ★★★ |
| 10 | Fix localStorage key drift (`'token'` → `clipcoba_token`) in `creditsApi`, `replicateApi`, `AudioRecorderNode` | S | ★★★★ |

### 5.2 Quick wins (≤ 2 weeks total)

| # | Action | Effort | Impact |
|---|---|---|---|
| 11 | Redirect `/` bug in `CreateClipPage` → `/dashboard`; add 404 route and ErrorBoundary | S | ★★★ |
| 12 | Landing: price + free-tier section, demo GIF, new headline, FAQ, meta/OG; unify brand name | M | ★★★★ |
| 13 | Empty dashboard CTA + 3-step first-run checklist ("install extension / save 3 videos / generate titles") | M | ★★★★ |
| 14 | Show subscription banner (revive `SubscriptionBanner`), fix `past_due` grace | S | ★★ |
| 15 | Replace `alert()/confirm()` with `ConfirmModal` + sonner; strip `console.log` | S | ★★ |
| 16 | Mobile bottom nav + spaces sheet under `md` | M | ★★★★ |
| 17 | Extension: remove `contextMenus`/`notifications`, dedupe match patterns, replace polling with observer-only, replace innerHTML in popup, add refresh logic to popup, build zip from source in CI, fix changelog, add privacy-policy URL, then submit to CWS | M | ★★★★ |
| 18 | `React.lazy` routes; self-host font; drop dupe deps (`uuid` types, duplicate players) | S–M | ★★ |
| 19 | Sidebar a11y: `aria-label`s, no `<a><button>` nesting, focus-visible; axe in CI | M | ★★ |
| 20 | Cap input sizes + `max_tokens` on all Gemini calls; caching of AI outputs by hash | S–M | ★★★ |

### 5.3 Medium (2–6 weeks)

| # | Action | Effort | Impact |
|---|---|---|---|
| 21 | **Pricing rebuild:** Free / Pro / Agency, 7-day trial, annual; Stripe products & webhooks for credits top-ups; AI credits metered *across all* AI calls via one atomic ledger (`UPDATE … WHERE balance >= n` + idempotency keys); reserve → settle → refund pattern | L | ★★★★★ |
| 22 | Auth hardening: 15-min access + rotating refresh (revoke on use, family detection), httpOnly cookie for web, token in header only for extension; email verification, password policy, rate limit | L | ★★★★ |
| 23 | Wedge #1 "Create from moodboard" + AI auto-tagging + search (title/transcript/tags, Postgres FTS) | L | ★★★★★ |
| 24 | Public/shareable boards (read-only link, OG image, "made with ClipCoba") | M–L | ★★★★ |
| 25 | Backend refactor: split `main.py` into `auth`, `clips`, `youtube` routers; `ai_agent.py` into one `LLMClient` with `run_with_retry`, timeouts, cost logging; structured logging + Sentry; remove double includes | L | ★★★ |
| 26 | Tests: pytest + httpx `TestClient` with Postgres container; start with auth, ownership matrix (every id route × other-user token), billing webhook, credit ledger; Playwright smoke (register → save → ideate); GitHub Actions CI; Replicate/Stripe mocked | L | ★★★★ |
| 27 | Move long AI work to a queue (RQ/Arq or Replicate webhooks everywhere), return job id; same for any retained thumbnail capture | L | ★★★ |
| 28 | Alembic as single schema source; drop `create_all`; add indexes (`clip(user_id, space_id)`, etc.); pagination on `/api/clips`; make `user_id` NOT NULL after backfill | M | ★★★ |
| 29 | Dockerfile + compose + Coolify config in repo; pin ffmpeg (apt) ; healthcheck; staging env | M | ★★★ |
| 30 | Theme: tokenise colours; add light mode + toggle | M | ★★ |

### 5.4 Big bets (quarter)

| # | Action | Effort | Impact |
|---|---|---|---|
| 31 | Agency edition: multi-seat spaces, invites, roles, client-view boards, comments | XL | ★★★★ |
| 32 | Multi-platform capture (TikTok/Instagram/Reels/Shorts timestamps) + mobile share-target PWA | XL | ★★★★ |
| 33 | Thumbnail pattern intelligence (embeddings, "similar to this", niche outlier dashboards) with cached daily outlier jobs (turn Viral Tracker into the free lead magnet) | XL | ★★★★ |
| 34 | Marketing site split (`clipcoba.com` static/Astro-or-Next; app on `app.clipcoba.com`), programmatic SEO pages | L | ★★★ |
| 35 | Revive Workflows as "Pro Lab" only if analytics show ≥10% of paying users run them | L | ★★ |

### 5.5 Suggested sequencing

- **Week 1:** items 1-10 (all security/abuse). Re-test with an ownership-matrix script; deploy; confirm `/api/credits/purchase`, `debug-activate`, anon `/api/info` return 4xx/501.
- **Week 2-3:** 11-20 + 17 (CWS submission) + brand/landing.
- **Week 4-8:** 21, 22, 26, 23.
- **Then:** 24, 25, 27-29, wedge-driven big bets. Owner approval gate before any rewrite/XL work, per the ticket.

### 5.5a Instrument first (needed for every decision above)

PostHog is available to the owner: track `signup`, `paywall_viewed`, `checkout_started`, `subscribed`, `clip_saved` (source: ext/web), `ideation_started/completed`, `ai_credit_spent`. Without these, activation, pricing and retention decisions are guesses. Also pull 30 days of Replicate and ScrapeCreators spend to calibrate credit prices.

### 5.6 Decisions the owner needs to make

1. Approve disabling download/capture/Viral Tracker/Workflows for now? (yes recommended)
2. Wedge choice (recommended: #1 swipe-file-that-writes, #2 as engine).
3. Pricing structure and whether to offer a free tier (recommended: yes).
4. Single brand: ClipCoba (recommended).
5. Confirm which DB is production (code/ini says Supabase pooler; owner mentions Neon) so credentials get rotated in the right place.

---

## Appendix A: Evidence index

- Secrets: `backend/auth.py:12`, `backend/alembic.ini:87`, `backend/test_scrape.py:7`, `unlock_prod_subscription.py:6`, `stripe.tar.gz` (Stripe CLI binary), `extension.zip` (v1.0).
- Free value leaks: `backend/routers/credits.py:97-125`, `backend/routers/billing.py:220-229`.
- Unauthenticated endpoints: `backend/main.py` L289 `/api/info`, L387 `/api/download`, L421 progress, L439 viral, L602 trending, L731 capture-thumbnail, L861 cleanup; `backend/routers/transcribe.py`.
- IDOR: `backend/routers/lab.py:32,60,124,161,367,409,424`; `backend/routers/moodboards.py:174,230,261`.
- Workflow engine: `backend/services/workflow_engine.py` (359), `backend/routers/workflow_executions.py:88-100`, `backend/services/credit_service.py`.
- UI: `frontend/src/App.tsx:27-90`, `components/Sidebar.tsx`, `components/Layout.tsx`, `pages/ClipsPage.tsx:226-262,426-459`, `pages/CreateClipPage.tsx:121,129`, `pages/SubscriptionPage.tsx:96-152`, `pages/LandingPage.tsx:61`, `utils/creditsApi.ts:29`, `utils/replicateApi.ts:18`, `context/AuthContext.tsx`.
- Extension: `extension/manifest.json`, `content.js`, `popup.js:285-288`, `auth-sync.js`, `CHANGELOG.md`.
- No `director*` tables anywhere (models, alembic, routers, frontend).

## Appendix B: Sources (web research, Nov 2026)

- [1of10 alternatives](https://1of10.com/blog/1of10-alternatives/) · [1of10 vs vidIQ](https://outlierkit.com/blog/1of10-vs-vidiq) · [YouTube tool pricing 2026](https://outlierkit.com/resources/youtube-tool-pricing/)
- [ThumbFa.st Inspiration Library](https://v3.thumbfa.st/inspiration-library)
- [Milanote pricing (Subger)](https://subger.com/en/service/milanote) · [Raindrop pricing](https://toolradar.com/tools/raindrop/pricing) · [Storyflow: best inspiration board apps 2026](https://storyflow.so/blog/best-inspiration-board-apps-2026)
- All competitor pricing/feature claims are from vendor or SEO pages and conflicting; verify before publishing.
