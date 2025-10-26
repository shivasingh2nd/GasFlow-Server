import { PrismaClient, Company, Category } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding cylinder types...");

  const cylinderTypes = [
    // HPCL
    { company: Company.HPCL, typeCategory: Category.Domestic, weightKg: 5 },
    { company: Company.HPCL, typeCategory: Category.Domestic, weightKg: 14.2 },
    { company: Company.HPCL, typeCategory: Category.Commercial, weightKg: 19 },
    { company: Company.HPCL, typeCategory: Category.Commercial, weightKg: 5 },

    // IOCL
    { company: Company.IOCL, typeCategory: Category.Domestic, weightKg: 5 },
    { company: Company.IOCL, typeCategory: Category.Domestic, weightKg: 14.2 },
    { company: Company.IOCL, typeCategory: Category.Commercial, weightKg: 19 },
    { company: Company.IOCL, typeCategory: Category.Commercial, weightKg: 5 },

    // BPCL
    { company: Company.BPCL, typeCategory: Category.Domestic, weightKg: 5 },
    { company: Company.BPCL, typeCategory: Category.Domestic, weightKg: 14.2 },
    { company: Company.BPCL, typeCategory: Category.Commercial, weightKg: 19 },
    { company: Company.BPCL, typeCategory: Category.Commercial, weightKg: 5 },
  ];

  for (const type of cylinderTypes) {
    await prisma.cylinderType.upsert({
      where: {
        company_typeCategory_weightKg: {
          company: type.company,
          typeCategory: type.typeCategory,
          weightKg: type.weightKg,
        },
      },
      update: {},
      create: type,
    });
  }

  console.log("✅ Cylinder types seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
