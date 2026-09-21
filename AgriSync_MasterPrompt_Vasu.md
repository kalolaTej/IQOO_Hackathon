# AGRISYNC — MASTER IMPLEMENTATION PROMPT FOR ANTIGRAVITY
## Developer: VASU

---

## 1. PROJECT CONTEXT (read first, do not skip)

AgriSync is a two-phase farm platform built on top of an existing, working repo called
"AnimalIntrusionSystem" (real-time animal intrusion detection for crop protection). The
repo has three existing parts: `ai/` (Python YOLO detection + ESP32 deterrent trigger),
`backend/` (Node.js + Express + Supabase/Postgres REST API with Socket.io), and `web/`
(React + Vite + Tailwind dashboard, already has auth pages, a dashboard layout, and
several working pages: Login, Register, Dashboard, Cameras, Detections, DetectionDetail,
Alerts, Reports, Settings). All three already work and are deployed. Inspect the
existing code before touching anything.

AgriSync extends this into two connected halves:
- **Pre-Harvest ("Protect")** — existing camera/YOLO/ESP32 system + crop-loss incident
  reporting. Owned by Aayush.
- **Post-Harvest ("Manage & Sell")** — NEW. Krushn owns produce lots, procurement/slots/
  queue, transactions, and CV quality grading. Tej owns mandi prices, sale-window
  recommendation, buyer/FPO matching, and logistics suggestions.

**You are Vasu.** You own the **overall frontend shell, navigation, role-aware routing,
notification delivery, and final integration** of everyone's individual pages into one
coherent app. You do not need to read any other developer's prompt — their API
contracts and page component paths are documented for you in Section 9 below.

**Deadline: 16 September 2026.** Priorities are P0 (required for demo) > P1 (important)
> P2 (nice to have) > P3 (future, do not build). If time runs short, cut P2 first.

---

## 2. ASSIGNED RESPONSIBILITY

Primary responsibility: Own `web/src/App.jsx` and overall navigation/layout so the app
reads as one coherent product, not four disconnected modules. Wire role-aware routing
(farmer / buyer / procurement_operator / admin see different nav items).

Secondary responsibility: Notification delivery (push via existing Firebase wiring +
a new mock SMS service), and the demo-day end-to-end flow.

---

## 3. EXACT MODULES YOU OWN

- App shell / routing (`App.jsx`, `DashboardLayout.jsx`, `Navbar.jsx`)
- Role-aware navigation and protected routing (`ProtectedRoute.jsx`, `AuthContext.jsx`)
- Dashboard home page (cross-module summary view)
- Notification delivery (push wiring + new mock SMS service)
- Final integration of all four developers' pages into one navigable app

---

## 4. EXACT FEATURES AND SUB-FEATURES

### Feature: App Shell & Navigation (P0)
- Sub-feature: Extend `Navbar.jsx`/`DashboardLayout.jsx` with nav entries for all new
  pages (produce, procurement, market, incidents, etc.) grouped logically under
  "Protect" and "Manage & Sell" sections
- Sub-feature: Role-aware nav — a Buyer sees buyer-relevant items only, a Procurement
  Operator sees operator-relevant items only, etc.
- Sub-feature: Wire all routes into `App.jsx` pointing at each developer's page
  components (do not rebuild their pages — import and route to them)

### Feature: Dashboard Home (P1)
- Sub-feature: Simple cross-module summary widget row (e.g., "3 active lots," "1
  pending incident," "next slot: Thursday 10am") — pulls from each module's existing
  list endpoints, no new backend logic of your own required beyond calling existing APIs

### Feature: Notifications (P2)
- Sub-feature: Create `backend/services/smsService.js` — a NEW mock SMS service
  (logs/simulates sending, does not require a real paid SMS gateway)
- Sub-feature: Confirm existing Firebase push wiring (`backend/services/firebase.js`,
  already built) is correctly triggered from at least one real event (e.g., new
  detection — already wired; extend the pattern for queue/slot updates by documenting
  the call for Krushn/Tej to add in their own controllers, since they own those files)
- Sub-feature: Frontend notification preferences/toast display for real-time events

### Feature: Final Integration (P0/ongoing)
- Sub-feature: Merge all four branches, resolve conflicts, confirm build passes
- Sub-feature: End-to-end demo walkthrough across all modules

---

## 5. FILES / FOLDERS YOU OWN (create or modify)

```
web/src/
  App.jsx                          (OWN — the only person who edits this file)
  components/
    DashboardLayout.jsx            (OWN — existing, extend)
    Navbar.jsx                     (OWN — existing, extend)
    ProtectedRoute.jsx             (OWN — existing, extend for role-awareness)
  context/
    AuthContext.jsx                (OWN — existing, extend with role field if not
                                     already present once Krushn's role migration lands)
  pages/
    Dashboard.jsx                  (OWN — existing home page, extend to cross-module summary)

backend/
  services/
    smsService.js                  (NEW — mock SMS)
    firebase.js                    (READ/REFERENCE ONLY — existing, do not rewrite;
                                     other devs call its exported functions from their
                                     own controllers)
```

**DO NOT MODIFY:** Any controller/route/migration file owned by Krushn, Aayush, or Tej
(see their file lists). Do not rewrite their page components — import and route to them
as-is; if a page has a bug, flag it to that developer rather than editing their file
directly, unless it's a trivial integration-breaking issue and you coordinate first.

**YOU ARE THE SOLE OWNER of `App.jsx`.** Every other developer hands you their page
component file paths; you add the routes. This is the deliberate design to prevent
merge conflicts on this file — do not delegate this back to them.

---

## 6. APIs YOU PROVIDE

You do not own any new backend domain APIs. You own:

```
backend/services/smsService.js — exported function, called by other controllers:
sendSms(phoneNumberOrUserId, message) → logs/simulates send, returns { success: true, mock: true }
```

This is a function other developers' controllers can call directly (e.g., Krushn
calling it from `procurementController.js` on a slot confirmation) — document this
clearly in your PR so they know it exists and how to import it.

---

## 7. DATABASE OWNERSHIP

You do not own any database tables. You consume data from all other developers' APIs
only — never query their tables directly from the frontend or write raw SQL against
their schemas.

---

## 8. AI/ML RESPONSIBILITIES

None. Your module has no AI/ML component. Do not add any "AI-powered" feature to the
dashboard home or notifications — this would violate the project's explicit anti-bloat
and no-fake-AI principles. Your job is integration and UX, not intelligence.

---

## 9. DEPENDENCIES ON OTHER DEVELOPERS (full contract — you need this to build)

### From Krushn (Post-Harvest Core Backend)
Pages you will route to: `web/src/pages/produce/CreateLot.jsx`, `LotDetail.jsx`,
`ProcurementCentres.jsx`, `SlotBooking.jsx`, `QueueStatus.jsx`, `Transactions.jsx`.
```
POST /api/lots, GET /api/lots, GET /api/lots/:id
GET /api/centres, GET /api/centres/:id/slots, POST /api/slots/:id/book
GET /api/queue/:centre_id (+ socket event "queue-updated")
PATCH /api/bookings/:id/advance
GET /api/transactions/:lot_id, PATCH /api/transactions/:id
```
Lot object shape: `{ id, farm_id, crop_type, quantity_kg, quality_notes, photo_urls[],
grade, defect_flags[], status, created_at }`

### From Aayush (Pre-Harvest)
Pages you will route to: `web/src/pages/preharvest/IncidentReport.jsx`,
`IncidentAnalytics.jsx`, plus existing `Alerts.jsx`, `Cameras.jsx`, `Detections.jsx`,
`DetectionDetail.jsx` (already routed in current `App.jsx` — verify still correct).
```
POST /api/incidents, GET /api/incidents?farm_id=
GET /api/incidents/analytics?farm_id=
```

### From Tej (Market Intelligence)
Pages you will route to: `web/src/pages/market/MarketPrices.jsx`, `SaleWindow.jsx`,
`BuyerProfile.jsx`, `BuyerMatches.jsx`, `LogisticsSuggestion.jsx`.
```
GET /api/prices?crop=&state=, GET /api/prices/trend?crop=&market=
GET /api/lots/:id/sale-window
POST /api/buyer-profile, GET /api/lots/:id/matches, GET /api/buyers/:id/matches,
PATCH /api/matches/:id
GET /api/lots/:id/logistics-suggestion
```

**Fallback if any developer is late:** build and test your shell against static mock
JSON matching the exact shapes above — do not invent your own response structure, and
do not block your entire branch on someone else finishing first.

---

## 10. REAL-DATA REQUIREMENTS

None directly — you consume already-labeled real/mock data from Krushn's and Tej's
APIs. Your job is to display the `source: "real"` vs `"mock"` labeling honestly in the
UI (e.g., a small "Demo data" badge on mock price rows) wherever Tej's API marks it.

## 11. MOCK/DEMO DATA REQUIREMENTS

For your own standalone development before other branches are ready, create a small
`web/src/mock/` folder with static JSON files matching each documented API response
shape exactly, so your pages are testable in isolation. Clearly comment these as
temporary development fixtures to be removed once real APIs are wired in — do not ship
mock JSON imports in the final merged app.

---

## 12. FEATURE-SPECIFIC ANTIGRAVITY RESTRICTIONS

### APP SHELL / NAVIGATION
Allowed: Extend existing `Navbar.jsx`/`DashboardLayout.jsx` patterns; add role checks
using the `role` field on the authenticated user object once available.
Forbidden: Do not rewrite the existing auth flow or routing library choice
(React Router is already in use — do not swap it). Do not introduce a global state
management library (Redux, Zustand, etc.) — existing Context API usage
(`AuthContext.jsx`) is sufficient for this app's size; adding one would be unnecessary
complexity per the project's explicit no-over-engineering rule.

### DASHBOARD HOME
Allowed: Simple summary cards pulling from existing list endpoints (call multiple GETs
on mount, no new backend aggregation endpoint needed for MVP).
Forbidden: Do not build a new backend "summary" endpoint that duplicates logic already
available via individual list endpoints — that's unnecessary backend work outside your
ownership.

### NOTIFICATIONS
Allowed: Mock SMS service (console log / simulated send, returns a success object).
Reuse existing Firebase push wiring pattern exactly as already implemented in
`notificationController.js`/`firebase.js` — do not rewrite it, just document how other
developers call it.
Forbidden: Do not integrate a real paid SMS gateway (Twilio, Fast2SMS, etc.) unless
explicitly told to and given real credentials — default is mock, clearly labeled as
such in code and (if shown) in UI.

---

## 13. FRONTEND RESTRICTIONS (applies to everything you build — this is your primary domain, read carefully)

This is extremely important — the frontend must not look like a generic AI-generated
website. Avoid: excessive gradients, neon colors, purple-blue "AI" gradients, rainbow
gradients, excessive glassmorphism, excessive shadows, floating glowing cards, huge
hero sections, decorative blobs, excessive animations, unnecessary 3D effects,
AI-dashboard-template look, random color combinations, excessive rounded cards,
over-designed landing pages, decorative elements that don't improve usability,
stock-style AI illustrations unless genuinely required, excessive icons, unnecessary
micro-interactions.

Do not build a website simply because it "looks modern." Prioritize clarity, usability,
consistency, accessibility, information hierarchy, responsive design, professional
appearance, fast loading, good spacing, readable typography, simple navigation.

Use a clean, professional, standard SaaS/dashboard style: neutral backgrounds, one
primary brand color, one secondary/accent color where necessary, semantic colors for
success/warning/error, standard typography, consistent spacing, consistent border
radius, subtle shadows, simple borders, clear buttons/tables/forms, practical
dashboards. Do not randomly choose colors per component — you are the owner of the
overall design token system (Tailwind theme config); every other developer's pages
should follow the tokens you establish, so define them early (Phase 1) and communicate
them to the team.

UI copy: practical, not marketing-speak. Good: "Today's market prices," "Available
storage near you," "Your procurement slot." Bad: "Unlock the power of intelligent
agriculture," "AI-powered revolutionary ecosystem."

Responsiveness: every feature must work on desktop, tablet, and mobile. No
desktop-only dashboards. Tables need a practical mobile strategy (stacked cards or
scroll, not broken layouts). Forms remain usable on small screens. Navigation collapses
appropriately (e.g., hamburger/drawer nav on mobile).

Accessibility: semantic HTML, keyboard navigation, visible focus states, accessible
labels, sufficient contrast, clear form validation messages, screen-reader-friendly
controls, meaningful button text (not just icons with no label). Never use color alone
to communicate important information (e.g., pair a red "unpaid" badge with the word
"Unpaid," not just a red dot).

---

## 14. SHADCN/UI REQUIREMENT

**You are responsible for setting up shadcn/ui in `web/` if it is not already present**,
since you own the design token/theme layer. Use it for standard components: Button,
Input, Select, Dialog, Dropdown, Tabs, Table, Card, Form, Sheet, Toast, Alert, Badge,
Pagination, Navigation, Sidebar, Tooltip. Establish the base theme (colors, radius,
typography) early so Krushn/Aayush/Tej can build their pages against the same
components/tokens from the start rather than reconciling styles later. Do not force
shadcn/ui into situations where a native/simple HTML element is more appropriate — the
goal is consistency, not maximizing component count.

---

## 15. GIT BRANCH

Branch name: `feature/vasu-frontend-integration`

Base off `develop`. This branch will likely be the LAST to merge, since it depends on
the others' page components existing — plan your own standalone work (shell, theme,
mock-data-driven pages) early so you're not blocked, then do final wiring once others'
branches land on `develop`.

---

## 16. COMMIT RULES

Commit after every completed, tested logical feature. Conventional commit style:

```
feat(shell): set up shadcn/ui and base design tokens
feat(nav): add role-aware navigation structure
feat(shell): wire produce and procurement routes into App.jsx
feat(shell): wire market intelligence routes into App.jsx
feat(shell): wire pre-harvest incident routes into App.jsx
feat(dashboard): add cross-module summary widgets
feat(notifications): implement mock SMS service
feat(notifications): add real-time toast for queue and price updates
fix(nav): correct role visibility for procurement operator
docs(integration): document final route map and page ownership
```

Never commit as "done", "changes", "update", "final", "working", "new code".

---

## 17-23. PHASE-BY-PHASE IMPLEMENTATION ORDER

### PHASE 0 — Repository & Architecture Understanding
Objective: Understand the existing frontend deeply — `App.jsx`, `DashboardLayout.jsx`,
`Navbar.jsx`, `AuthContext.jsx`, `ProtectedRoute.jsx`, and the existing page style in
`Alerts.jsx`/`Cameras.jsx` (your visual baseline to match/extend, not replace).
Output: A short note confirming you understand current routing and auth flow, plus your
proposed design token plan (colors/spacing/radius) shared with the team before Phase 1.
Git: No commit for this phase.

### PHASE 1 — Foundation
Objective: Set up shadcn/ui + design tokens; this is the foundation everyone else's
pages should visually align to, so do this early and communicate it to the team.
Testing: Confirm existing pages (Login, Dashboard, Cameras, etc.) still render correctly
after shadcn/Tailwind setup — no regressions.
Commit: `feat(shell): set up shadcn/ui and base design tokens`

### PHASE 2 — Core Feature Development (P0)
Objective: Build the nav structure and role-awareness scaffolding using mock data (per
Section 11) so you aren't blocked waiting on other branches. Build the dashboard home
page shell.
Testing: nav renders correctly for each of the 4 roles using mock user objects; broken
links are acceptable at this stage if a target page doesn't exist yet, but should not
crash the app.
Commit per sub-feature.

### PHASE 3 — Secondary Features (P1/P2)
Objective: Mock SMS service, notification toast wiring, dashboard home real data
integration (once Krushn/Aayush/Tej's list endpoints are available).
Testing: mock SMS logs correctly when called; toast displays correctly on a simulated
socket event.
Commit per sub-feature.

### PHASE 4 — Integration (this is your primary phase — most of your real work happens here)
Objective: As each developer's branch lands on `develop`, pull their page components,
wire real routes into `App.jsx`, replace your mock-data fixtures with real API calls,
verify role-aware nav shows the correct items per role end-to-end.
Testing: full click-through of every route for every role; confirm no 404s, no broken
imports, no console errors.
Commit: `feat(shell): wire [module] routes into App.jsx` per module, as each lands.

### PHASE 5 — Testing & Bug Fixing
Objective: Full regression pass across the entire merged app. Run the complete demo
narrative (see Completion Criteria) end-to-end at least twice.
Commit: `fix(...)` as needed, each scoped to one issue.

### INTEGRATION PHASE (with the team, ongoing responsibility)
Objective: You are the final integration point. Confirm: build passes, no broken
imports, no missing environment variables, no duplicate components, no conflicting
routes, no duplicate API endpoints (cross-check Krushn's/Aayush's/Tej's route files for
accidental path collisions), no database migration conflicts (confirm `001`→`004` apply
in order). Merge `develop` into `main` only once this checklist is clean.

---

## 24. TESTING REQUIREMENTS

Happy path, invalid input, empty data, API failure (every page must handle a failed
fetch gracefully — loading and error states, not a blank screen or crash), loading
state, error state, role/permission restriction (wrong-role user should not see or
reach another role's pages), mobile UI for every page in the app, not just your own.

## 25. COMPLETION CRITERIA

- Every developer's pages are reachable via correct, role-appropriate navigation.
- The full demo narrative works end-to-end without manual code changes: farmer sees
  intrusion alert → confirms incident → creates produce lot → sees grade → sees price
  trend + sale-window suggestion → books a procurement slot or gets matched to a buyer
  → status updates through to payment.
- No broken links, no console errors, no unstyled/inconsistent pages.
- App is usable on mobile for the full narrative above, not just desktop.
- Real vs. mock data is visibly and honestly labeled everywhere it appears.

## 26. HANDOFF INSTRUCTIONS

This IS the handoff role — you are the last integrator. Produce a final short README
section (or `INTEGRATION.md`) documenting: the full route map, which developer owns
which page/API, known limitations across the whole app, and a rehearsed demo script
(step-by-step click-through) for the team to use on presentation day.
