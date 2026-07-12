# Complete demo seeder design

## Objective

Replace the minimal administrator-only seed with a destructive, deterministic demo dataset that makes every current Kavok Warehouse module useful immediately after running `pnpm db:seed`.

## Execution contract

- `pnpm db:seed` deletes all application records before inserting the demo dataset.
- Deletion follows relation order so foreign keys remain valid.
- Every successful run produces the same records and totals.
- The command prints created totals and development credentials when it finishes.
- The seed is intended for development and demonstration databases. It must clearly warn that existing application data is deleted.

## Dataset

### Users

- One active administrator: `admin` / `admin123`.
- One active operator: `operador` / `operador123`.
- Passwords are stored as bcrypt hashes.

### Aircraft

Create five active aircraft with distinct Venezuelan `YV` registrations and plausible model names.

### Parts catalog

Create exactly 50 deterministic master parts using plausible aviation-oriented part numbers and descriptions.

The catalog must include:

- rotable, consumable, and expendable categories;
- serial and lot tracking;
- realistic units of measure, manufacturers, ATA chapters, and optional shelf lives;
- several symmetric alternate-part relationships.

Part definitions must satisfy the application rules: serial-tracked parts represent individually controlled units, while lot-tracked parts can carry quantities greater than one.

### Stock

Create exactly 100 stock items spread across the 50 parts. Use deterministic identifiers, locations, dates, quantities, and conditions.

The resulting dataset must exercise the UI states:

- serviceable, unserviceable, and scrap stock;
- expired items;
- items expiring within 30 days;
- items with no expiration date;
- depleted items with zero quantity;
- multiple warehouse zones and shelves;
- serial numbers for serial-tracked parts and lot numbers for lot-tracked parts.

Every serial-tracked stock item starts with quantity one unless it is intentionally depleted, in which case its current quantity is zero.

### Movement history

Every stock item receives an `initial_stock` movement representing its original quantity and destination location. The initial movement is attributed deterministically to one of the seeded users.

For depleted items, create a subsequent dispatch movement for the original quantity so the current zero balance agrees with the movement history. This preserves the append-only movement model and makes the movements screen representative.

No dispatch orders are required by this seed. Depletion movements may represent legacy/direct dispatches and therefore leave `dispatchOrderId` null.

## Implementation structure

Keep the implementation in `prisma/seed.ts`, with small local helpers for deterministic dates, part definitions, stock generation, and cleanup. Use a Prisma transaction for destructive cleanup and another transaction or bounded batched operations for insertion. Avoid random-number generation so failures are reproducible.

The cleanup order is:

1. `StockMovement`
2. `DispatchOrder`
3. `StockItem`
4. `PartAlternate`
5. `Part`
6. `Aircraft`
7. `User`

## Error handling and verification

- Allow Prisma errors to fail the process with a non-zero exit code.
- Disconnect the Prisma client in `finally`.
- Assert the in-memory definitions contain exactly 50 parts and generate exactly 100 stock items before insertion.
- After insertion, query database counts and fail if the requested totals are not present.
- Run Prisma/TypeScript execution against the configured database to verify the completed seed when credentials and database connectivity are available.

## Out of scope

- Production-safe incremental seeding.
- Randomized datasets.
- More than two users or five aircraft.
- Prebuilt dispatch orders.
- Changes to the Prisma schema, application UI, or existing business actions.
