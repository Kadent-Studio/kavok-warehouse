import type {
  MovementType,
  PartCategory,
  Role,
  StockStatus,
  TrackingType,
} from "@prisma/client";

export const roleLabel: Record<Role, string> = {
  operator: "Operador",
  admin: "Administrador",
};

export const trackingTypeLabel: Record<TrackingType, string> = {
  serial: "Por serial",
  lot: "Por lote",
};

export const partCategoryLabel: Record<PartCategory, string> = {
  rotable: "Rotable",
  consumable: "Consumible",
  expendable: "Expendible",
};

export const stockStatusLabel: Record<StockStatus, string> = {
  serviceable: "Serviciable",
  unserviceable: "No serviciable",
  scrap: "Scrap",
};

export const movementTypeLabel: Record<MovementType, string> = {
  initial_stock: "Inventario inicial",
  receipt: "Recepción",
  dispatch: "Salida",
  transfer: "Transferencia",
  status_change: "Cambio de estado",
};
