import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password', 10);
  // Seed currency
  await prisma.currency.upsert({
    where: { code: 'USD' },
    update: {},
    create: { code: 'USD', name: 'United States dollar', symbol: '$' },
  });

  // Seed company
  const company = await prisma.company.upsert({
    where: { id: 'c1' },
    update: {},
    create: { id: 'c1', name: 'Innovate Inc.', currency: { connect: { code: 'USD' } } },
  });

  // Seed users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@expenseasy.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@expenseasy.com',
      password: hash,
      role: 'admin' as any,
      avatarUrl: 'https://picsum.photos/seed/1/100/100',
      company: { connect: { id: company.id } },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@expenseasy.com' },
    update: {},
    create: {
      name: 'Manager Mike',
      email: 'manager@expenseasy.com',
      password: hash,
      role: 'manager' as any,
      avatarUrl: 'https://picsum.photos/seed/2/100/100',
      company: { connect: { id: company.id } },
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@expenseasy.com' },
    update: {},
    create: {
      name: 'Employee Emma',
      email: 'employee@expenseasy.com',
      password: hash,
      role: 'employee' as any,
      avatarUrl: 'https://picsum.photos/seed/3/100/100',
      company: { connect: { id: company.id } },
      manager: { connect: { id: manager.id } },
    },
  });

  const cfo = await prisma.user.upsert({
    where: { email: 'cfo@expenseasy.com' },
    update: {},
    create: {
      name: 'CFO Carol',
      email: 'cfo@expenseasy.com',
      password: hash,
      role: 'manager' as any,
      avatarUrl: 'https://picsum.photos/seed/4/100/100',
      company: { connect: { id: company.id } },
    },
  });

  // Seed some expenses
  await prisma.expense.createMany({
    data: [
      {
        id: 'e1',
        description: 'Client Dinner at The Grand Bistro',
  amount: '150.75' as any,
        currency: 'USD',
        category: 'Meals & Entertainment',
        date: new Date('2023-10-26T19:00:00.000Z'),
        status: 'approved',
        employeeId: employee.id,
        comments: 'Approved by Manager Mike.',
        approvalRules: { type: 'percentage', percentageThreshold: 50 },
      } as any,
      {
        id: 'e2',
        description: 'Flight to New York for conference',
  amount: '450.00' as any,
        currency: 'USD',
        category: 'Travel',
        date: new Date('2023-10-22T08:30:00.000Z'),
        status: 'pending',
        employeeId: employee.id,
        approvalRules: { type: 'specific_approver', requiredApprovers: [cfo.id] },
      } as any,
      {
        id: 'e3',
        description: 'Software Subscription (Monthly)',
  amount: '29.99' as any,
        currency: 'USD',
        category: 'Software',
        date: new Date('2023-10-20T12:00:00.000Z'),
        status: 'rejected',
        employeeId: employee.id,
        comments: 'This should be on the corporate card, not personal expense.',
        approvalRules: { type: 'percentage', percentageThreshold: 75 },
      } as any,
      {
        id: 'e4',
        description: 'Team Lunch',
  amount: '85.50' as any,
        currency: 'EUR',
        category: 'Meals & Entertainment',
        date: new Date('2023-10-18T13:00:00.000Z'),
        status: 'pending',
        employeeId: employee.id,
        approvalRules: { type: 'hybrid', percentageThreshold: 60, requiredApprovers: [manager.id] },
      } as any,
      {
        id: 'e5',
        description: 'Office Supplies from Staples',
  amount: '55.20' as any,
        currency: 'USD',
        category: 'Office Supplies',
        date: new Date('2023-10-15T15:45:00.000Z'),
        status: 'approved',
        employeeId: employee.id,
        approvalRules: { type: 'percentage', percentageThreshold: 50 },
      } as any,
    ],
    skipDuplicates: true,
  });

  // Seed some approvals for e1 and e5
  await prisma.approval.createMany({
    data: [
      {
        id: 'a1',
        expenseId: 'e1',
        approverId: manager.id,
        decision: 'approved',
        timestamp: new Date('2023-10-27T10:00:00.000Z'),
        comments: 'Looks good!',
      },
      {
        id: 'a2',
        expenseId: 'e5',
        approverId: manager.id,
        decision: 'approved',
        timestamp: new Date('2023-10-16T14:00:00.000Z'),
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
