const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subjects = [
  "HINDI 1", "HINDI 2", "ENGLISH 1", "ENGLISH 2", 
  "HISTORY", "CIVICS", "GEOGRAPHY", "PHYSICS", 
  "CHEMISTRY", "BIOLOGY", "MATHS", "MORAL SCIENCE", 
  "GK", "SANSKRIT"
];

async function main() {
  console.log('Seeding subjects...');
  for (const sub of subjects) {
    await prisma.subject.upsert({
      where: { name: sub },
      update: {},
      create: { name: sub },
    });
  }
  console.log('Subjects seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
