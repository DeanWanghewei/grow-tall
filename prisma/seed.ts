import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const child = await prisma.child.upsert({
    where: { id: 'seed-child-1' },
    update: { gender: 'MALE' },
    create: {
      id: 'seed-child-1',
      name: '豆豆',
      gender: 'MALE',
      birthDate: new Date('2021-04-01'),
      themeId: 'warm',
      fatherHeight: 178,
      motherHeight: 165,
    },
  });

  const days = (n: number) => new Date(Date.UTC(2024, 0, 1) + n * 86400000);
  const samples = [
    { date: days(0), height: 88, weight: 12.5 },
    { date: days(180), height: 96, weight: 14.2 },
    { date: days(365), height: 104, weight: 16.1 },
    { date: days(540), height: 110, weight: 18.0 },
    { date: days(700), height: 115.2, weight: 21.5 },
  ];
  for (const s of samples) {
    await prisma.record.upsert({
      where: { childId_date: { childId: child.id, date: s.date } },
      update: {},
      create: { childId: child.id, date: s.date, height: s.height, weight: s.weight },
    });
  }
  console.log('seeded');
}

main().finally(() => prisma.$disconnect());
