# Kavok Warehouse — Design System

## Direction

**Hangar a plena luz (Hangar Daylight).** Cálido, preciso y agradable de usar por horas. Herramienta de trabajo aeronáutica, pero NO fría ni de terminal. (Reemplaza la dirección previa "workshop terminal", que resultó demasiado seca.)

- Superficies **crema cálido** (tinte amarillo-tierra, no gris-azulado frío)
- Texto en **tinta marrón** (warm near-black), no negro puro
- Un solo accent: **índigo cálido** (`--primary`, hue ~277)
- **Sombras suaves cálidas** en cards + bordes finos (ya no borders-only)
- Radios redondeados (base 10px)
- Tipografía en tres roles (ver abajo)
- Signature: **etiquetas de estado tipo ribbon** (SVC / UNS / SCR) con tonos ricos

## Tipografía

- **Display** (`--font-display`, Bricolage Grotesque): títulos de página (h1 27px), section headers, KPIs grandes, títulos de card. Clase `.font-display` o `h1/h2` automáticos. `letter-spacing: -0.015em`.
- **Sans/body** (`--font-sans`, Hanken Grotesk): todo el cuerpo, labels, tablas.
- **Mono** (`--font-mono`, Geist Mono): SOLO identificadores reales — P/N, seriales, lote, UoM, ATA, códigos de sección. Clase `.font-data`.
- **Números en UI** (cantidades, fechas, vida útil): NO mono. Usar la sans con clase `.tnum` (tabular-nums). Esto quita la rigidez de "terminal".

## Tokens (globals.css)

- `--ink`, `--ink-muted`, `--ink-faint` — jerarquía de texto en 3 niveles (marrón cálido)
- `--primary` — índigo cálido (accent único); `--color-navy` es alias → `--primary` (compat)
- `--tag-svc-*`, `--tag-uns-*`, `--tag-scr-*` — status ribbons ricos (bg/fg/border)
- `--radius: 0.625rem` (10px): `sm` 6px, `md` 8px, `lg` 10px, `xl` 14px, `2xl` 18px
- `--shadow-card`, `--shadow-card-lift` — sombras cálidas suaves → utilidades `.elevated`, `.elevated-lift`
- `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)`

## Depth strategy

**Sombras suaves + bordes.** Cards y tablas: `border border-border rounded-xl bg-card elevated`. Dialogs con su propia sombra shadcn.

## Spacing

Base 4px. Padding de página: `p-6 lg:p-8`. Cards: `p-5`/`p-6`. Celdas de tabla: `px-4 py-3`. Formularios grid `[220px_1fr] gap-6 md:gap-10`.

## Animación

- `data-press` → scale(0.97) en `:active`, 140ms ease-out-strong. En cualquier pressable.
- `.rise-in` → entrada translateY(6px)+fade 360ms. Usar en cards, tablas (contenedor, NO por fila), empty states. KPIs con `animationDelay` escalonado (~55ms).
- Todo respeta `prefers-reduced-motion`.

## Component patterns

### `<PageHeader>` — display title 27px, eyebrow mono en `text-primary/70` con código de sección, border-bottom, `pb-7`.
### `<StatusTag>` — signature ribbon. Variantes `ribbon` / `code` / `full`. Tonos vía tokens `--tag-*`.
### `<EmptyState>` — `rounded-xl border-dashed bg-muted/40`, título display 16px, code en `text-primary/60`, `.rise-in`.
### Sidebar — brand con cuadro índigo "K" (font-display), items con section codes mono (00/01/02/03/99).
### Formularios "workshop form" — grid sección-izquierda + campos-derecha; eyebrow "Sección A" mono `text-primary/60`; headers display 16px; required marker `text-navy/70` (= índigo); hints `text-[11.5px] text-ink-faint`.
### Tablas — wrapper `rounded-xl bg-card elevated .rise-in`; header `bg-muted/70` uppercase 10.5px; filas `hover:bg-accent/60`; P/N en `.font-data` con hover `text-primary`; cantidades/fechas en `.tnum` (sans, NO mono).

## Component API notes

- **Instalar, no construir**: si un componente existe en shadcn, instalarlo con `pnpm dlx shadcn@latest add <componente>` antes de escribir nada. Solo construir a mano lo que shadcn NO ofrece. Los wrappers de composición a nivel de app (client component que envuelve un primitivo shadcn para conectar router/estado) sí se escriben a mano.
- **shadcn 4.12 con base-ui**: NUNCA `asChild`. Usar `render={<Link>…</Link>}`.
- Cuando un `Button` renderiza un `<Link>`/`<a>`: pasar **`nativeButton={false}`** para evitar el warning de accesibilidad de Base UI.
- `Select onValueChange` recibe `string | null` — proteger con `v && setState(v)`.

## Semantic color usage

- `primary` (índigo) — acciones principales, links activos, required markers, foco, eyebrows/section codes
- `tag-svc` (verde) — Serviceable; `tag-uns` (ámbar) — Unserviceable + warnings inline; `tag-scr` (rojo) — Scrap
- `destructive` — solo acciones destructivas irreversibles

## What NOT to do

- No gris-azulado frío en superficies — siempre crema cálido
- No mono para cantidades/fechas — solo para identificadores; números UI usan `.tnum`
- No negro puro en texto — tinta marrón (`--ink`)
- No borders-only seco — usar `.elevated` en cards/tablas
- No radios afilados — mínimo `rounded-lg`/`rounded-xl` en cards
- No mezclar Radix `asChild` — este proyecto es base-ui `render`
- No múltiples acentos — todo índigo
- No reconstruir componentes UI que shadcn ya provee — instalar vía CLI (ver Component API notes)
