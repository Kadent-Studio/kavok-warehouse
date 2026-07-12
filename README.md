# Kavok Warehouse

Sistema web para el control de un **almacén aeronáutico**: trazabilidad de partes por serial y por lote, control de estado (serviciable / no serviciable / scrap), bitácora inmutable de movimientos y gestión de usuarios por rol.

Construido como base escalable para el cliente — arranca simple y crece por módulos.

---

## Módulos

| Módulo | Descripción |
| --- | --- |
| **Dashboard** | KPIs del almacén: partes, ítems en stock, por vencer y no serviciables. |
| **Catálogo** | Fichas maestras de part numbers: fabricante, categoría, unidad, capítulo ATA, vida útil, partes alternas. |
| **Stock** | Ítems físicos (serial o lote), ubicación (zona/estante), estado y vencimiento. Recepción, inventario inicial y operaciones. |
| **Movimientos** | Bitácora append-only de todo evento de stock, con filtros y rango de fechas. |
| **Usuarios** | Alta de operadores/administradores, roles y contraseñas (solo admin). |

### Reglas de negocio clave

- Despachar más de lo disponible → **bloqueado**.
- Despachar ítem no serviciable / scrap → **motivo obligatorio**.
- Despachar ítem vencido → **advertencia** (no bloquea).
- Los movimientos son **inmutables**; las correcciones se hacen con un movimiento inverso.
- Las partes con historial se **archivan** (soft-delete), no se borran.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** + Turbopack
- **PostgreSQL** ([Neon](https://neon.tech)) + **Prisma 6**
- **Auth.js v5** (usuario + contraseña, roles operator/admin)
- **shadcn/ui** (base-ui) + **Tailwind CSS v4**
- Despliegue en **Vercel**
- Zona horaria: `America/Caracas` · UI en español

---

## Desarrollo local

Requisitos: Node 20+, [pnpm](https://pnpm.io), y una base PostgreSQL (Neon o local).

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
#   - DATABASE_URL / DIRECT_URL → cadenas de conexión de Neon
#   - AUTH_SECRET               → openssl rand -base64 32

# 3. Aplicar el esquema y sembrar el usuario admin
pnpm db:push
pnpm db:seed        # crea admin / admin123 (cámbialo tras el primer login)

# 4. Levantar
pnpm dev
```

Abre http://localhost:3000 y entra con `admin` / `admin123`.

---

## Scripts

| Comando | Acción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción (genera el cliente Prisma) |
| `pnpm start` | Servir el build |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Sincronizar esquema Prisma → BD |
| `pnpm db:seed` | Crear usuario admin inicial |
| `pnpm db:studio` | Explorador visual de la BD |

---

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión *pooled* de Neon (con `-pooler`). Usada por la app. |
| `DIRECT_URL` | Conexión directa de Neon (sin `-pooler`). Usada por migraciones. |
| `AUTH_SECRET` | Secreto de Auth.js. Genera con `openssl rand -base64 32`. |
| `AUTH_TRUST_HOST` | `true` (necesario en Vercel y desarrollo). |
| `AUTH_URL` | URL pública de la app (opcional; Vercel la infiere). |
| `NEXT_PUBLIC_APP_TIMEZONE` | `America/Caracas`. |

---

## Despliegue (Vercel + Neon)

1. Conecta este repositorio en [Vercel](https://vercel.com/new).
2. Define las variables de entorno del cuadro anterior en el proyecto de Vercel.
3. Vercel ejecuta `pnpm build` (que corre `prisma generate` automáticamente).
4. El esquema vive en la misma base Neon; aplica cambios con `pnpm db:push` apuntando a producción.

Cada push a `main` despliega a producción.

---

## Arquitectura

```
app/
  (app)/              # área autenticada (layout con sidebar)
    dashboard/
    parts/            # catálogo
    stock/            # inventario + operaciones
    movements/        # bitácora
    users/            # admin
  login/              # acceso público
  api/                # rutas de auth y búsqueda
components/           # UI compartida (shadcn + primitivas del proyecto)
lib/                  # prisma, fechas, csv, labels
prisma/               # schema + seed
```

Modelo de datos central: `Part` (catálogo) → `StockItem` (unidad física) → `StockMovement` (evento append-only).

---

_Proyecto privado. Uso interno del cliente._
