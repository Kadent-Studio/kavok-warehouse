# Dashboard operational log design

## Objective

Transform the current KPI-only dashboard into an operational overview centered on recent warehouse activity while retaining a balanced view of stock health and urgent conditions.

## User and intent

The primary user is a warehouse operator or administrator beginning a work session. They need to understand what moved recently, what needs attention, and which operational task to perform next.

The dashboard should feel like an organized, daylight aircraft hangar: warm, precise, legible for long work sessions, and visibly connected to aviation inventory rather than finance or generic SaaS analytics.

## Design direction

Use the existing **Hangar Daylight** design system in `.interface-design/system.md`.

- Palette: warm cream documentation surfaces, brown ink, and warm indigo navigation/action emphasis.
- Semantic color: serviceable green, quarantine/warning amber, and scrap/critical red only where status or urgency justifies it.
- Depth: thin borders plus the existing warm, soft card shadow. No dramatic elevation.
- Typography: Bricolage Grotesque for page and metric display, Hanken Grotesk for operational reading, and Geist Mono only for identifiers such as part numbers and movement codes.
- Spacing: 4 px base unit, existing `p-6 lg:p-8` page padding, and `p-5`/`p-6` cards.
- Motion: existing `rise-in` animation with small staggered delays and reduced-motion support.

## Domain signature

The signature element is a **live hangar log**: recent movements are presented as the primary narrative of the warehouse, with movement type, part number, quantity, condition/location context, responsible user, and timestamp. Status ribbons and aviation identifiers make the dashboard recognizable as an aircraft-parts warehouse even without the product name.

This replaces three generic dashboard defaults:

1. Four equal metric cards become a hierarchy of operational indicators with different internal expressions.
2. Decorative charts become a factual seven-day movement pulse and exact stock-condition distribution.
3. A generic activity table becomes a compact, linked hangar log using part numbers, movement vocabulary, and status ribbons.

## Information architecture

### Header

Retain `PageHeader` and show:

- section eyebrow `00 · Panel`;
- personalized greeting;
- concise operational description;
- current Caracas date;
- primary link to `/dispatch` labeled `Registrar despacho`.

### Operational indicators

Show four top-level indicators:

- active stock items with quantity greater than zero;
- movements recorded today in the Caracas operating day;
- dispatch orders created during the current seven-day window;
- open attention count, defined as the sum of expired positive-quantity items, items expiring within 30 days, unserviceable positive-quantity items, and scrap positive-quantity items.

These indicators share surface treatment but use different spans and internal emphasis within the bento. Alert color is applied only to the attention indicator when its value is non-zero.

### Bento composition

The dashboard uses one asymmetric operational bento rather than a row of equal cards. On large screens it follows a 12-column grid with aligned row heights and a 16 px gap:

- the recent activity module is the dominant piece, spanning approximately eight columns and two rows;
- attention required occupies a four-column vertical piece beside activity;
- the seven-day pulse spans a wide horizontal piece beneath the activity log;
- condition distribution and quick actions use smaller supporting pieces;
- the four top-level indicators are integrated into the bento as compact pieces with varied spans instead of appearing as a detached KPI-card row.

Every bento piece is a single surface. Do not place decorative cards inside other cards. Internal rows use dividers or subtle tint shifts rather than nested borders and shadows. On small screens, pieces stack in the order: indicators, recent activity, attention, pulse, condition distribution, quick actions.

#### Recent hangar activity

Query the latest eight stock movements. Each event includes:

- movement type and timestamp;
- part number and description;
- quantity and unit of measure;
- responsible user's full name;
- relevant source/destination location or dispatch recipient;
- a direct link to the stock item.

Movement types receive restrained semantic treatment: receipts/initial stock use indigo or serviceable language, transfers remain neutral/indigo, dispatches use amber, and status changes reflect the resulting stock condition.

When no movements exist, render the existing `EmptyState` pattern.

#### Seven-day movement pulse

Aggregate movements into seven Caracas calendar days ending today. Show one compact horizontal bar per day using CSS widths and exact counts. The component must avoid a chart dependency and remain understandable when all counts are zero.

### Attention and stock health

#### Attention required

Show exact counts and filtered navigation links for:

- expired stock;
- expiring within 30 days;
- unserviceable stock;
- scrap stock.

Only positive-quantity stock contributes. Rows use semantic tokens and restrained tinted icon containers. Zero-count rows remain visible but visually quiet so the operator can confirm there is no issue.

#### Condition distribution

Show serviceable, unserviceable, and scrap positive-quantity item counts with a segmented horizontal bar and exact values. Segment widths derive from the total and handle a zero total without division errors.

### Quick actions

Provide direct links to:

- `/stock/new` for reception or initial inventory;
- `/dispatch` for a new dispatch;
- `/parts/new` for a new catalog part;
- `/movements` for the full log.

Use the existing Base UI/shadcn button API with `render` and `nativeButton={false}` for links.

## Data implementation

Keep the dashboard as an async Server Component. Establish one `now` value and derive all time boundaries from it before rendering to satisfy React purity rules.

Use parallel Prisma queries for independent counts, recent movements, and seven-day activity. The implementation must not change the database schema or add dependencies.

Dates shown to the user use existing `lib/dates.ts` formatting and the `America/Caracas` timezone. Day-boundary queries must be explicitly derived for Caracas rather than silently relying on the server timezone.

Small dashboard-only presentational components may live in `app/(app)/dashboard/page.tsx` while the page remains readable. Extract a component only if it has a clear reusable boundary or makes the page materially easier to understand.

## Responsive and accessibility behavior

- Compact indicators use two columns on small screens and varied spans in the 12-column desktop bento.
- The bento stacks activity, attention, pulse, distribution, and actions on narrow screens without horizontal overflow.
- Links and actions have visible hover and focus states.
- Color is never the only status cue; every semantic state includes text and an icon or code.
- Bars expose exact numeric values in adjacent text.
- Entrance animation respects the existing reduced-motion rule.

## Verification

- Run ESLint against dashboard files.
- Run TypeScript with `tsc --noEmit`.
- Run the production build if the existing unrelated worktree changes permit it.
- Verify both light and dark token usage in code and confirm no raw decorative colors bypass the design tokens.
- Check empty data and zero-total calculations by inspection or isolated helpers.

## Out of scope

- New database tables or persisted analytics.
- A chart library.
- Dashboard filters or date-range controls.
- Changes to the sidebar or other application modules.
- Automatic refresh or realtime subscriptions.
