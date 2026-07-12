import type { DestinationType } from "@prisma/client";

/** Human-friendly dispatch folio, e.g. 42 → "DESP-0042". */
export function formatFolio(n: number) {
  return `DESP-${String(n).padStart(4, "0")}`;
}

/**
 * Readable destination label for a dispatch. Used both in the UI and to
 * denormalize the movement's `recipient` so the Movements view stays legible.
 */
export function destinationLabel(input: {
  destinationType: DestinationType;
  aircraft?: { registration: string } | null;
  destinationText?: string | null;
}): string {
  if (input.destinationType === "aircraft") {
    return input.aircraft?.registration ?? "Aeronave";
  }
  return input.destinationText?.trim() || "Otro";
}
