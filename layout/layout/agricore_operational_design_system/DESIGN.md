---
name: AgriCore Operational Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#404940'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707a6f'
  outline-variant: '#bfc9bd'
  surface-tint: '#1f6c3a'
  primary: '#004c22'
  on-primary: '#ffffff'
  primary-container: '#166534'
  on-primary-container: '#93e0a2'
  inverse-primary: '#8bd79b'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#00456c'
  on-tertiary: '#ffffff'
  tertiary-container: '#005d90'
  on-tertiary-container: '#a7d4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f4b5'
  primary-fixed-dim: '#8bd79b'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#94ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-xl:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system embodies enterprise-grade agricultural logistics: grounded, resilient, methodical, and utilitarian. Built specifically for complex procurement, APMC mandi transactions, quality grading, and supply-chain reconciliation, the UI eschews ornamental trends (no glow effects, 3D abstractions, or gratuitous gradients) in favor of crisp typography, structural borders, compact data density, and immediate legibility under high-glare ambient field conditions.

### Design Movement
- **Pragmatic Modernism / Radix & shadcn/ui Utility:** Solid canvas backgrounds, 1px structural hairline dividers, balanced neutral tones, and predictable focus rings.
- **Operational Density:** Tailored for both high-throughput desktop entry (weighbridge receipts, auction bid books) and mobile field audits (crop arrivals, quality testing reports).
- **Accessible State Clarity:** Critical agricultural workflows require immediate confirmation; badges, statuses, and key indicators strictly pair color with explicit iconography and typographic labels to ensure clear contrast and zero ambiguity.

## Colors

The color palette centers on a disciplined forest green anchor, balanced by cool slate/zinc neutrals to provide a stable, fatigue-free operational environment.

### Core Swatches
- **Primary (`#166534` - Emerald/Forest 800):** Primary actions, verified badges, active selection indicators, and primary navigation states. Hover state transitions to `#14532d` (Forest 900); active state drops to `#052e16`.
- **Secondary (`#475569` - Slate 600):** Supporting controls, tab indicators, secondary button borders, and subtle interactive strokes.
- **Tertiary (`#0369a1` - Sky/Blue 700):** Operational logistics, transit tracking markers, vehicle dispatch states, and system notifications.
- **Neutral Foreground (`#0f172a` - Slate 900):** High-contrast base typography and high-priority data metrics.

### Canvas & Surface Architecture
- **App Background:** `#f8fafc` (Slate 50)
- **Component Surface (Cards, Tables, Modals):** `#ffffff` (Pure White)
- **Subtle Surface / Table Headers:** `#f1f5f9` (Slate 100)
- **Hairline Borders & Separators:** `#e2e8f0` (Slate 200)
- **Muted / Secondary Text:** `#64748b` (Slate 500)
- **Tertiary / Disabled Text:** `#94a3b8` (Slate 400)

### Semantic Palette (Workflow Indicators)
All status badges pair tinted backgrounds with high-contrast text and a paired structural icon:
- **Success / Completed / Mandi Verified:** Background `#f0fdf4`, Border `#bbf7d0`, Text `#166534`
- **Warning / Pending / Weighbridge Queue:** Background `#fffbeb`, Border `#fde68a`, Text `#b45309`
- **Destructive / Rejected / Quality Failure:** Background `#fef2f2`, Border `#fecaca`, Text `#b91c1c`
- **Informational / Dispatch / Route Transit:** Background `#f0f9ff`, Border `#bae6fd`, Text `#0369a1`
- **Draft / Inactive / Archive:** Background `#f8fafc`, Border `#e2e8f0`, Text `#475569`

## Typography

Typography prioritizes dense tabular reading, consistent vertical metrics, and cross-platform clarity. Inter provides neutral clarity across both Roman script and regional data inputs.

### Typographic Rules
- **Tabular Figures:** All financial figures (₹ / INR), quintal/metric ton metrics, lot IDs, moisture percentages, and gate-pass serials strictly enforce `font-feature-settings: "tnum" 1, "cv05" 1`.
- **Labels & Micro-headers:** Section markers and table column heads use `label-xs` or `label-sm` with subtle letter-spacing and uppercase styling where appropriate (`letter-spacing: 0.04em; font-weight: 600`).
- **Mobile Constraints:** Display levels collapse uniformly below 640px. Mandi dashboards avoid large display sizes on field terminals to preserve horizontal viewports for tabular data.

## Layout & Spacing

The layout follows a fluid-responsive system bound to a 12-column grid on desktop and a continuous stack on mobile. Spacing favors compact vertical rhythms to permit scanning hundreds of line items without fatigue.

### Breakpoints & Layout Adapters
- **Desktop (>= 1280px):** 12-column grid with `1.5rem` gutters and a fixed 240px collateral navigation sidebar. Margins maintain a structured `2rem`.
- **Tablet / Rugged Mandi Terminals (768px – 1279px):** 8-column layout, collateral sidebar collapses to a 64px compact icon rail. Content gutter scales to `1rem`.
- **Mobile Handheld (< 768px):** 4-column single flow, persistent bottom command bar for APMC gate-in entries, margin drops to `1rem`.

### Density Tiers
- **Standard Layout:** Card and form paddings use `space-lg` (`1rem`) to `space-xl` (`1.5rem`).
- **Dense Data (Table Rows, Quality Slips):** Vertical padding collapses to `0.375rem` (`6px`) with horizontal padding locked to `0.75rem` (`12px`) to maximize visible records per viewport.

## Elevation & Depth

Depth is established strictly through 1px border containment and restrained, ultra-low opacity ambient shadows. Elements never lift into high-blur planes; components stay tactile and grounded.

### Surface Hierarchy
- **Base 0 (Canvas):** `#f8fafc` — Platform backdrop.
- **Level 1 (Cards, Data Panels, Data Tables):** `#ffffff` with a crisp `1px solid #e2e8f0` border and `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Popovers, Select Menus, Dropdown Panes):** `#ffffff` with `1px solid #cbd5e1` border and `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Slide-over Verification Drawers):** `#ffffff` with `1px solid #cbd5e1` border and `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)`.

### Backdrop Scrim
Modals and drawer overlays use a flat, darkened slate mask: `rgba(15, 23, 42, 0.45)` with no excessive blur (`backdrop-filter: blur(2px)` maximum) to keep user focus oriented.

## Shapes

The design system employs precise, disciplined curvature (`roundedness: 1`). Elements do not use playful circular pills except for compact inline workflow badges.

### Metric Rules
- **Buttons, Inputs, Selects, and Cell Badges:** Default to `0.25rem` (4px) to `0.375rem` (6px) for an engineered, reliable tool feel.
- **Cards, Panels, and Table Shells:** Bound at `0.5rem` (8px).
- **Modals and Flyout Sheets:** Maximum `0.5rem` (8px).
- **Status Pills:** Small categorical tags may use `9999px` strictly when rendered in micro sizes (`fontSize <= 12px`).

## Components

### Buttons
- **Primary Action:** Solid `#166534` background, `#ffffff` text, 1px border `#14532d`, font-weight 500. Focus outline uses `ring-2 ring-emerald-600 ring-offset-2`. Height: 36px (compact operational) or 40px (standard).
- **Secondary / Outline:** `#ffffff` surface, 1px border `#e2e8f0`, text `#0f172a`. Hover: `#f8fafc`, border `#cbd5e1`.
- **Destructive:** `#ffffff` surface with `#b91c1c` text and `#fecaca` border, or solid `#b91c1c` with `#ffffff` text for irremediable actions (e.g., lot rejection).
- **Ghost / Table Inline:** Flat transparent background, text `#475569`, hover `#f1f5f9`.

### Chips & Badges
- Strictly structural: height 22px, padding 2px 8px, font-size 11px, font-weight 600, border-radius 4px.
- Never use raw colored text without an accompanying border/background container.
- Always prefix statuses with micro-icons (e.g., checkmark for `Verified`, clock for `Mandi Queue`, exclamation triangle for `Quality Mismatch`, truck for `In Transit`).

### Input Fields & Controls
- **Text & Numeric Inputs:** Height 36px, background `#ffffff`, 1px border `#cbd5e1`, font-size 14px, placeholder `#94a3b8`. Focus state uses `border-color: #166534` with an active focus ring `box-shadow: 0 0 0 1px #166534`.
- **Unit Adornments:** Inputs for weights, moistures, and prices include fixed, gray-backed prefix/suffix slots (e.g., `₹`, `Qtl`, `%`, `MT`) styled with background `#f1f5f9` and border `#e2e8f0`.
- **Checkboxes & Radios:** Rigid 16x16px boxes with 3px border radius. Unselected: `#ffffff` with `#cbd5e1` border; Selected: `#166534` with white checkmark icon.

### Data Tables (APMC & Procurement Centerpiece)
- **Container:** Pure `#ffffff` surface wrapped in a 1px `#e2e8f0` stroke.
- **Header:** Height 36px, background `#f8fafc`, text `#475569`, uppercase 11px, `font-weight: 600`, border-bottom `1px solid #e2e8f0`.
- **Row:** Height 44px, alternating hover state `#f8fafc`, bottom hairline divider `#f1f5f9`.
- **Cell Content:** Tabular figures aligned right for monetary values and weight measurements; left-aligned for lot descriptors; centered for single-letter quality grades (Grade A, FAQ).

### Cards & Metrics
- **Metric Tile:** White background, 1px `#e2e8f0` border, `0.5rem` radius. Header displays category label in `label-sm` with slate muted color; large value rendered in `display-sm` with `tnum` numeric alignment, paired with day-over-day delta indicator.
- **Lot / Consignment Card:** Compact modular card with lot ID header, farmer name, crop variety (e.g., Sharbati Wheat, Chana), verified bag count, and dual-action buttons (Accept / Re-sample).