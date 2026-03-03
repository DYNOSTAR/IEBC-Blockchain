import { PrismaClient, PositionLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const counties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
    'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
    'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Muranga', 'Kiambu', 'Turkana', 'West Pokot',
    'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi',
    'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
    'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
    'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ];

  for (let i = 0; i < counties.length; i += 1) {
    await prisma.county.upsert({
      where: { code: i + 1 },
      update: {},
      create: {
        name: counties[i],
        code: i + 1,
      },
    });
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@iebc.go.ke' },
    update: {},
    create: {
      email: 'admin@iebc.go.ke',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
    },
  });

  const election = await prisma.election.create({
    data: {
      name: 'Kenya General Election 2027',
      description: 'Sample election for testing',
      electionType: 'GENERAL',
      startDate: new Date('2027-08-09'),
      endDate: new Date('2027-08-09'),
      status: 'UPCOMING',
    },
  });

  const positions = [
    { name: 'President', level: PositionLevel.PRESIDENT },
    { name: 'Governor', level: PositionLevel.GOVERNOR },
    { name: 'Senator', level: PositionLevel.SENATOR },
    { name: 'Member of Parliament', level: PositionLevel.MP },
    { name: 'Woman Representative', level: PositionLevel.WOMEN_REP },
    { name: 'Member of County Assembly', level: PositionLevel.MCA },
  ];

  for (const pos of positions) {
    await prisma.position.create({
      data: {
        name: pos.name,
        level: pos.level,
        electionId: election.id,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
