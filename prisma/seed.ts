import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  // Create superuser
  const hashedPassword = await bcrypt.hash("changeme123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@personal-pm.com" },
    update: {},
    create: {
      email: "admin@personal-pm.com",
      password: hashedPassword,
      name: "Admin User",
      bio: "Superuser of Personal PM Tool",
    },
  });

  console.log("Seed completed!");
  console.log("Superuser created:");
  console.log("Email:", user.email);
  console.log("Password: changeme123");
  console.log("\nPlease change the password after first login!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
