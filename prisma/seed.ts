import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      passwordHash,
      fullName: "Administrador",
      role: "admin",
    },
  });

  console.log(`Usuario admin listo. username=${username} password=${password}`);
  console.log("Cambia la contraseña después del primer login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
