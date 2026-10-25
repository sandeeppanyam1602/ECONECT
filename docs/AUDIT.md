# ECONECT — Stage 1 Audit Report

Audited: `Kabadiwala-connect_Final-02.zip` (Figma Make export). Date: 24 Oct 2026.
Everything below was verified by reading the code, running `npm install`, `npm run build` and `tsc --noEmit`.

## 1. Current structure

| Item | Finding |
|---|---|
| Framework | React 19 + TypeScript 5.7 + Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`) |
| Runtime deps | Only `react`, `react-dom`, `lucide-react` |
| Source | `src/App.tsx` (1,471 lines, ~81 KB) holds **every** screen, all data and the router. `main.tsx`, `index.css` (279 lines) are the only other source files |
| UI components | Hand-written inside App.tsx: `Btn`, `BadgePill`, `Field`, `SelectField`, `MockMap`, `ProgressSteps`, `MobileShell`, `TopBar`, `BottomNav`, `KabBottomNav`. **No shadcn / component library folder** exists |
| Routing | None. A `useState<Screen>` string switch (27 screens). No URLs, no browser Back, refresh returns to splash |
| State | 4 `useState`s in `App` (screen, role, language, selectedCollector) + 4 local ones (condition, selected address, day, slot). Nothing is shared between screens |
| Styling | Design tokens in `index.css` (`bg-brand-primary`, `gap-xl`, `text-label-sm`…). Primary colour `#5250f3` (indigo), font Instrument Sans. Layout is a fixed 390 px phone frame |
| Backend / DB / API / auth | **None** (no `fetch`, no storage, no file input) |
| Tests / lint | None. Formatter `oxfmt` only |
| Docs found | `AGENTS.md`, `CLAUDE.md` (Figma boilerplate), `guidelines/Guidelines.md`, two original Figma prompts in `src/imports/pasted_text/` |

## 2. Build health (actually run)

- `npm install`: OK (45 packages).
- `npm run build` (baseline): **passed** (301 KB JS).
- `tsc --noEmit` (baseline): **4 errors** — duplicate `className` attributes (App.tsx lines 218, 261, 776, 1135). In React the second attribute wins, so the first was silently dropped: the back-button circle, progress-step circle, date chips and marketplace chips lost styling.
- **Fixed in this stage** (merged each pair into one `className`). After the fix: `tsc` exit 0, build passes.

## 3. What works vs. what is only visual

| Area | Status |
|---|---|
| Screen-to-screen clickable flow (citizen: home → category → add → estimate → collector → detail → address → date/time → review → confirm → track → journey) | **Works visually** (navigation only) |
| Back buttons, bottom nav, progress steps, day/slot/address selection highlight, "condition" toggle | Work (local UI state) |
| Collector flow: login → register → ID → dashboard → pickups / price board / find recycler / earnings | Clickable, **all fake** |
| Recycler flow | Dashboard + one list screen only; reached with **no login** |
| Language selection | Stores a string; **no translation exists** |
| Everything else (login, ID generation, prices, weights, estimate, booking, tracking, earnings, journey, recycler list) | **Hard-coded demo values** |

Hard-coded data: `COLLECTORS`, `RECYCLERS`, `PRICE_DATA`, `MARKETPLACE_ITEMS`; "KC-10482" (6×), pickup ID "KC10245", "HANDOVER-KC-82741", "LOT-KC-24091", earnings ₹2,840 / ₹520 etc., dashboard counts 4 / 2 / ₹620, Bangalore area names.

Dead or misleading controls found:
- `Open Camera` (l.513): no handler, no `<input type=file>` exists anywhere.
- `Contact Collector` (l.704, l.934), `View Details` (l.935, l.1307), `Accept` (l.1306), `Buy Now` (l.1159), `+` / `−` map buttons (l.194–195), marketplace search/filter chips (l.1127–1135), add-address (l.743), a subtle button on l.839, "Listen to Safety Guide" (l.1047): **no action**.
- `Field` / `SelectField` are **uncontrolled and unbound** — typed values are never read. Login accepts any input.
- "Create Scrap Lot" on the collector dashboard navigates to *Today's Pickups* (wrong target; no lot screen exists).
- "Estimated value" screen shows a fixed range regardless of input.

## 4. Spec-compliance risks found

1. **Unverified trust claims.** "✓ Verified" (l.637), "Authorized Recycler" (l.948, 1370, 1403), "Connect with verified collectors" (l.318) are printed unconditionally. The ECONECT spec forbids this; badges must come from the DB verification status.
2. **Fabricated numbers** (prices, earnings, "Paid" status, UPI) appear as if real; payments must be shown as "recorded", not "transferred".
3. **Branding** is still "Kabadiwala Connect"; `package.json` name is `figma-make-app`.
4. **Marketplace** (buy/sell lots) is not in the ECONECT spec. Needs a decision (see §7).
5. **Guidelines.md** refers to `@figma/astraui-kit`, which is not installed — stale Figma boilerplate, safe to remove.
6. `vite.config.ts` contains Figma-specific plugins and uses `__dirname` (a Vite warning). Builds fine; will be simplified when the frontend is moved.
7. Fixed 390 px phone frame suits citizens/collectors but **not** admin, centre or recycler dashboards (need a desktop layout).

## 5. Current vs. required feature matrix

Legend: ● UI only (hard-coded) ○ missing ✔ real

| Requirement | Now |
|---|---|
| Register / login, JWT, roles | ○ (fake screens ●) |
| Citizen: profile, location, categories, photo, AI suggestion, correction, weight/condition, estimate | ● categories/weight/condition; ○ rest |
| Pickup create / assign / accept / status lifecycle | ● |
| Collector: profile, verification, unique ID, area, availability, earnings, history | ● |
| Weigh / final value / transaction / receipt | ○ |
| Waste ID + journey events | ● (static timeline) |
| Collection centre role (inventory, transfers) | ○ no screens |
| Recycler role (profile, accept/reject, receipt, processing) | ● 2 screens |
| Admin role (verify, users, prices, analytics, audit logs) | ○ no screens |
| Pricing engine (DB, snapshots) | ○ |
| AI classification service | ○ |
| Maps (Leaflet/OSM), nearby, routing | ● SVG mock map only |
| Notifications | ○ |
| Multilingual (EN/HI/TE/TA/MR) | ○ language list only |
| Safety info | ● static cards |
| Backend, PostgreSQL, Alembic, tests, Docker, docs | ○ none |

**Roughly:** the prototype covers the *look* of ~40 % of the citizen/collector screens; it implements **0 %** of the backend, data, security, AI, admin and centre requirements.

## 6. Sandbox facts affecting the plan

- Python 3.12, Node 22, npm 10 available; PyPI/npm reachable.
- **PostgreSQL and Docker are not installed here.** Plan: try `apt install postgresql` for real Postgres testing in Stage 3; if that fails, run the pytest suite on SQLite and clearly report that Postgres/Docker were *not* tested.
- PyTorch + a labelled waste dataset are heavy and need internet/licence checks; Stage 8 will ship a clearly labelled **demo mode** unless a real model can be trained and evaluated.

## 7. Decisions I will take (tell me if you disagree)

1. Move the frontend into `frontend/` (`git mv`-style, no rewrite) and add `backend/`, `docs/`, `docker-compose.yml`.
2. Keep the existing indigo design tokens and Instrument Sans; split `App.tsx` into `pages/`, `components/`, `services/`, `i18n/` **without redesigning**.
3. Add React Router (URLs + browser Back), a small API service layer, and Zustand-free plain React context for auth/language.
4. **Marketplace:** hide it from navigation (kept in git history) — it is out of ECONECT scope.
5. Keep the mobile frame for citizen/collector; build desktop-width layouts for admin, centre and recycler.
6. Seed rates are labelled "ILLUSTRATIVE DEMO RATE"; no real market prices.

## 8. Staged plan (matches your Stages 2–12)

| Stage | Deliverable | Gate to pass |
|---|---|---|
| 2 | Rebrand, move to `frontend/`, split App.tsx, router, wire/disable every dead button, controlled forms, ECONECT labels, remove false "Verified/Authorized" text | `tsc`, build, Vitest smoke |
| 3 | FastAPI skeleton, SQLAlchemy models (17 tables), Alembic, seed script | migrations apply; seed repeatable |
| 4 | Auth (argon2, JWT, RBAC), profiles | pytest auth + RBAC |
| 5 | **Core workflow**: pricing engine, pickups, status machine, weigh, complete, transaction, receipt | pytest incl. double-accept, bad transitions, rate snapshot, duplicate completion |
| 6 | Waste IDs + event journey | pytest events |
| 7 | Centre inventory + recycler transfers/matching | pytest |
| 8 | `/waste/classify` + demo-mode fallback (real model only if trained and evaluated) | invalid-image + model-unavailable tests |
| 9 | Leaflet/OSM, nearby, nearest-neighbour, optional OSRM, OR-Tools later | graceful fallback test |
| 10 | Admin verification, users, prices, analytics, audit log | permission tests |
| 11 | Integration, i18n (5 languages), end-to-end run | full test run documented |
| 12 | SIH demo script, README, honest limitations list | new-developer setup test |

## 9. Next exact step

Stage 2, step 1: create `frontend/`, move the existing files in, rename package to `econect-frontend`, rebrand strings, then split `App.tsx` into modules and add routing.
