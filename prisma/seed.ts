import {
  Part,
  PartCategory,
  Prisma,
  PrismaClient,
  TrackingType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_TODAY = new Date("2026-07-12T12:00:00.000Z");

type PartDefinition = {
  partNumber: string;
  description: string;
  trackingType: TrackingType;
  manufacturer: string;
  unitOfMeasure: string;
  ataChapter: string;
  category: PartCategory;
  shelfLifeDays: number | null;
};

const parts: PartDefinition[] = [
  ["AE2100D3-GBX", "Gearbox de accesorios", "serial", "Rolls-Royce", "EA", "72", "rotable", null],
  ["23064818", "Bomba de combustible", "serial", "Collins Aerospace", "EA", "73", "rotable", null],
  ["65-52810-041", "Actuador de flap", "serial", "Boeing", "EA", "27", "rotable", null],
  ["822-1293-002", "Transceptor VHF", "serial", "Collins Aerospace", "EA", "23", "rotable", null],
  ["622-9352-001", "Computadora de navegación", "serial", "Collins Aerospace", "EA", "34", "rotable", null],
  ["066-50001-0101", "Transpondedor modo S", "serial", "Honeywell", "EA", "34", "rotable", null],
  ["2118966-7", "Unidad de control ambiental", "serial", "Honeywell", "EA", "21", "rotable", null],
  ["714A0100-001", "Motor de arranque neumático", "serial", "Safran", "EA", "80", "rotable", null],
  ["C6T-1001", "Generador AC", "serial", "Thales", "EA", "24", "rotable", null],
  ["9912050-4", "Indicador de presión", "serial", "Ametek", "EA", "31", "rotable", null],
  ["PWC305-401", "Control electrónico de motor", "serial", "Pratt & Whitney", "EA", "73", "rotable", null],
  ["3001-45-001", "Válvula de sangrado", "serial", "Parker Aerospace", "EA", "36", "rotable", null],
  ["DHC8-32-110", "Actuador de tren principal", "serial", "Safran Landing Systems", "EA", "32", "rotable", null],
  ["KRA-405B", "Radioaltímetro", "serial", "Honeywell", "EA", "34", "rotable", null],
  ["LCR-100", "Grabador de voz de cabina", "serial", "L3Harris", "EA", "23", "rotable", null],
  ["APS-1000", "Unidad de potencia auxiliar", "serial", "Honeywell", "EA", "49", "rotable", null],
  ["A320-27-001", "Servo de piloto automático", "serial", "Airbus", "EA", "22", "rotable", null],
  ["CRJ-29-204", "Bomba hidráulica eléctrica", "serial", "Eaton", "EA", "29", "rotable", null],
  ["ERJ-30-118", "Válvula antihielo", "serial", "Embraer", "EA", "30", "rotable", null],
  ["ATR72-32-510", "Unidad de control de frenos", "serial", "Safran Landing Systems", "EA", "32", "rotable", null],
  ["MS21919-WDG12", "Abrazadera cushioned", "lot", "Parker", "EA", "20", "expendable", null],
  ["NAS1149F0363P", "Arandela plana aeronáutica", "lot", "National Aerospace", "EA", "20", "expendable", null],
  ["MS21042-3", "Tuerca autofrenante", "lot", "SPS Technologies", "EA", "20", "expendable", null],
  ["AN3-7A", "Perno hexagonal", "lot", "Airfasco", "EA", "20", "expendable", null],
  ["MS24693-C4", "Tornillo máquina", "lot", "Clarendon", "EA", "20", "expendable", null],
  ["NAS6604-12", "Perno estructural", "lot", "LISI Aerospace", "EA", "20", "expendable", null],
  ["MS20470AD4-5", "Remache sólido universal", "lot", "Alcoa", "EA", "51", "expendable", null],
  ["DAN1821-4", "Pasador de seguridad", "lot", "Boeing Distribution", "EA", "20", "expendable", null],
  ["M83248-1-012", "O-ring fluorocarbono", "lot", "Parker", "EA", "20", "expendable", 1825],
  ["M25988-1-011", "O-ring nitrilo", "lot", "Eaton", "EA", "20", "expendable", 1095],
  ["AS3209-214", "Sello hidráulico", "lot", "Trelleborg", "EA", "29", "expendable", 1460],
  ["BACB30MY6K", "Collar de fijación", "lot", "Boeing", "EA", "20", "expendable", null],
  ["NAS1097AD4-6", "Remache cabeza reducida", "lot", "National Aerospace", "EA", "51", "expendable", null],
  ["MIL-PRF-5606H", "Fluido hidráulico mineral", "lot", "Eastman", "QT", "12", "consumable", 1825],
  ["HYJET-V", "Fluido hidráulico fosfato éster", "lot", "Eastman", "QT", "12", "consumable", 1825],
  ["MOBIL-JET-II", "Aceite para turbina", "lot", "ExxonMobil", "QT", "79", "consumable", 1825],
  ["AEROSHELL-500", "Aceite sintético de turbina", "lot", "Shell Aviation", "QT", "79", "consumable", 1825],
  ["AEROSHELL-33", "Grasa multipropósito", "lot", "Shell Aviation", "TU", "12", "consumable", 1095],
  ["PR-1422-B2", "Sellante integral de combustible", "lot", "PPG Aerospace", "KT", "28", "consumable", 270],
  ["PR-1440-B2", "Sellante de parabrisas", "lot", "PPG Aerospace", "KT", "56", "consumable", 270],
  ["EA9394", "Adhesivo epóxico estructural", "lot", "Henkel", "KT", "51", "consumable", 365],
  ["SCOTCH-WELD-2216", "Adhesivo epóxico flexible", "lot", "3M", "KT", "51", "consumable", 540],
  ["ALODINE-1201", "Recubrimiento de conversión", "lot", "Henkel", "GL", "51", "consumable", 730],
  ["ARDROX-AV30", "Compuesto anticorrosivo", "lot", "Chemetall", "CN", "51", "consumable", 1095],
  ["SKYDROL-PE5", "Fluido hidráulico resistente al fuego", "lot", "Eastman", "GL", "29", "consumable", 1825],
  ["NYCO-GREASE-GN06", "Grasa para rodamientos", "lot", "NYCO", "CN", "12", "consumable", 1460],
  ["MEK-ACS", "Solvente metil etil cetona", "lot", "AeroShell", "GL", "20", "consumable", 1095],
  ["IPA-99-AERO", "Alcohol isopropílico 99%", "lot", "Chemicals Global", "GL", "20", "consumable", 730],
  ["BMS10-11-T1", "Primer epóxico anticorrosivo", "lot", "AkzoNobel", "GL", "51", "consumable", 365],
  ["AMS-3276", "Sellante de acceso rápido", "lot", "Flamemaster", "KT", "53", "consumable", 365],
].map(([partNumber, description, trackingType, manufacturer, unitOfMeasure, ataChapter, category, shelfLifeDays]) => ({
  partNumber: partNumber as string,
  description: description as string,
  trackingType: trackingType as TrackingType,
  manufacturer: manufacturer as string,
  unitOfMeasure: unitOfMeasure as string,
  ataChapter: ataChapter as string,
  category: category as PartCategory,
  shelfLifeDays: shelfLifeDays as number | null,
}));

const aircraft = [
  { registration: "YV3012", model: "ATR 72-600" },
  { registration: "YV3058", model: "Embraer ERJ-190" },
  { registration: "YV3210", model: "Boeing 737-400" },
  { registration: "YV3307", model: "Cessna 208B Grand Caravan" },
  { registration: "YV3451", model: "Beechcraft King Air 350" },
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function assertDataset(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Dataset inválido: ${message}`);
}

async function clearDatabase() {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany(),
    prisma.dispatchOrder.deleteMany(),
    prisma.stockItem.deleteMany(),
    prisma.partAlternate.deleteMany(),
    prisma.part.deleteMany(),
    prisma.aircraft.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  assertDataset(parts.length === 50, `se esperaban 50 partes y hay ${parts.length}`);
  assertDataset(aircraft.length === 5, `se esperaban 5 aeronaves y hay ${aircraft.length}`);

  console.warn("ADVERTENCIA: el seed eliminará todos los datos existentes.");
  await clearDatabase();

  const [adminPasswordHash, operatorPasswordHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("operador123", 10),
  ]);

  const [admin, operator] = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        passwordHash: adminPasswordHash,
        fullName: "Administrador Kavok",
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        username: "operador",
        passwordHash: operatorPasswordHash,
        fullName: "Operador de Almacén",
        role: "operator",
      },
    }),
  ]);

  await prisma.aircraft.createMany({ data: aircraft });

  const createdParts: Part[] = [];
  for (const definition of parts) {
    createdParts.push(await prisma.part.create({ data: definition }));
  }

  const alternatePairs = [[0, 1], [3, 4], [28, 29], [33, 34], [35, 36], [38, 39], [40, 41], [43, 44]];
  await prisma.partAlternate.createMany({
    data: alternatePairs.flatMap(([left, right]) => [
      { partId: createdParts[left].id, alternateId: createdParts[right].id },
      { partId: createdParts[right].id, alternateId: createdParts[left].id },
    ]),
  });

  const locations = [
    ["A", "A-01"], ["A", "A-04"], ["B", "B-02"], ["B", "B-06"],
    ["C", "C-03"], ["CUARENTENA", "Q-01"], ["TALLER", "T-02"],
  ] as const;

  let stockCreated = 0;
  let movementCreated = 0;

  for (let partIndex = 0; partIndex < createdParts.length; partIndex += 1) {
    const part = createdParts[partIndex];
    const definition = parts[partIndex];

    for (let copy = 0; copy < 2; copy += 1) {
      const stockIndex = partIndex * 2 + copy;
      const [zone, shelf] = locations[stockIndex % locations.length];
      const depleted = stockIndex % 17 === 0;
      const initialQuantity = definition.trackingType === "serial" ? 1 : 8 + ((stockIndex * 7) % 73);
      const currentQuantity = depleted ? 0 : initialQuantity;
      const status = stockIndex % 19 === 0 ? "scrap" : stockIndex % 11 === 0 ? "unserviceable" : "serviceable";
      const receiptDate = addDays(DEMO_TODAY, -(45 + ((stockIndex * 23) % 900)));

      let expirationDate: Date | null = null;
      if (definition.shelfLifeDays != null) {
        if (stockIndex % 9 === 0) expirationDate = addDays(DEMO_TODAY, -20 - (stockIndex % 40));
        else if (stockIndex % 7 === 0) expirationDate = addDays(DEMO_TODAY, 5 + (stockIndex % 24));
        else expirationDate = addDays(receiptDate, definition.shelfLifeDays);
      }

      const item = await prisma.stockItem.create({
        data: {
          partId: part.id,
          serialNumber: definition.trackingType === "serial" ? `SN-${String(partIndex + 1).padStart(3, "0")}-${copy + 1}` : null,
          lotNumber: definition.trackingType === "lot" ? `LOT-26-${String(partIndex + 1).padStart(3, "0")}-${copy + 1}` : null,
          quantity: new Prisma.Decimal(currentQuantity),
          zone,
          shelf,
          status,
          receiptDate,
          expirationDate,
          notes: status === "serviceable" ? null : "Condición incluida para demostración y filtros.",
        },
      });
      stockCreated += 1;

      await prisma.stockMovement.create({
        data: {
          stockItemId: item.id,
          type: "initial_stock",
          quantity: new Prisma.Decimal(initialQuantity),
          userId: stockIndex % 4 === 0 ? operator.id : admin.id,
          timestamp: receiptDate,
          toZone: zone,
          toShelf: shelf,
          newStatus: status,
          referenceNumber: `INV-INICIAL-${String(stockIndex + 1).padStart(3, "0")}`,
          notes: "Carga inicial del dataset demostrativo.",
        },
      });
      movementCreated += 1;

      if (depleted) {
        await prisma.stockMovement.create({
          data: {
            stockItemId: item.id,
            type: "dispatch",
            quantity: new Prisma.Decimal(initialQuantity),
            userId: operator.id,
            timestamp: addDays(receiptDate, 30),
            fromZone: zone,
            fromShelf: shelf,
            recipient: "Consumo histórico de demostración",
            referenceNumber: `SAL-DEMO-${String(stockIndex + 1).padStart(3, "0")}`,
            reason: status === "serviceable" ? null : "Salida autorizada para demostración",
          },
        });
        movementCreated += 1;
      }
    }
  }

  assertDataset(stockCreated === 100, `se generaron ${stockCreated} existencias`);

  const [userCount, aircraftCount, partCount, stockCount, movementCount] = await Promise.all([
    prisma.user.count(),
    prisma.aircraft.count(),
    prisma.part.count(),
    prisma.stockItem.count(),
    prisma.stockMovement.count(),
  ]);

  assertDataset(userCount === 2, `la base contiene ${userCount} usuarios`);
  assertDataset(aircraftCount === 5, `la base contiene ${aircraftCount} aeronaves`);
  assertDataset(partCount === 50, `la base contiene ${partCount} partes`);
  assertDataset(stockCount === 100, `la base contiene ${stockCount} existencias`);
  assertDataset(movementCount === movementCreated, `la base contiene ${movementCount} movimientos; se esperaban ${movementCreated}`);

  console.log("\nDataset demostrativo creado correctamente:");
  console.log(`- Usuarios: ${userCount}`);
  console.log(`- Aeronaves: ${aircraftCount}`);
  console.log(`- Partes: ${partCount}`);
  console.log(`- Existencias: ${stockCount}`);
  console.log(`- Movimientos: ${movementCount}`);
  console.log("\nCredenciales:");
  console.log("- Administrador: admin / admin123");
  console.log("- Operador: operador / operador123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
