const TZ = "America/Caracas";

export function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

export function formatDateTime(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export type ExpiryStatus = "none" | "ok" | "soon" | "expired";

/** Days until expiration (negative = past). null if no expiry. */
export function daysUntil(expiration: Date | null | undefined, now = new Date()) {
  if (!expiration) return null;
  const ms = expiration.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function expiryStatus(
  expiration: Date | null | undefined,
  now = new Date(),
): ExpiryStatus {
  if (!expiration) return "none";
  const days = daysUntil(expiration, now)!;
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

/** Compute expiration date from a receipt date + shelf life in days. */
export function computeExpiration(
  receiptDate: Date,
  shelfLifeDays: number | null | undefined,
): Date | null {
  if (shelfLifeDays == null) return null;
  const d = new Date(receiptDate);
  d.setDate(d.getDate() + shelfLifeDays);
  return d;
}
