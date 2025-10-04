import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      company: {
        select: {
          name: true,
          currencyCode: true
        }
      }
    }
  });
  
  console.log('\n✅ Database verification:');
  console.log(`Found ${users.length} users:`);
  users.forEach((user: typeof users[number]) => {
    console.log(`  - ${user.email} (${user.role}) at ${user.company?.name}`);
  });
  
  const expenses = await prisma.expense.count();
  console.log(`\nFound ${expenses} expenses`);
  
  const companies = await prisma.company.count();
  console.log(`Found ${companies} companies`);
  
  const currencies = await prisma.currency.count();
  console.log(`Found ${currencies} currencies\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
