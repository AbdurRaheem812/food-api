import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const EMAIL = "admin@gmail.com"; 

await prisma.user.update({
  where: { email: EMAIL },
  data: {
    userRoles: {
      create: {
        role: {
          connectOrCreate: {
            where: { role: "ADMIN" },
            create: { role: "ADMIN" },
          },
        },
      },
    },
  },
});

console.log(`✅ ${EMAIL} is now an ADMIN`);
await prisma.$disconnect();