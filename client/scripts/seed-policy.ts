import { PrismaClient } from '@prisma/client';

async function run() {
  const p = new PrismaClient();
  try {
    const company = await p.company.findFirst();
    const manager = await p.user.findFirst({ where: { role: 'manager' as any } });
    const cfo = await p.user.findFirst({ where: { email: 'cfo@expenseasy.com' } });
    if (company && manager) {
      await p.approvalPolicy.create({
        data: {
          companyId: company.id,
          description: 'Default misc policy',
          isManagerApprover: true,
          managerFirst: true,
          sequential: true,
          minApprovalPercentage: 50,
          approvers: {
            create: [
              { approverId: null, approverType: 'manager', required: true, order: 1 },
              { approverId: cfo?.id || manager.id, approverType: 'user', required: false, order: 2 },
            ],
          },
        },
      });
      console.log('Policy created');
    } else {
      console.log('No company/manager found');
    }
  } finally {
    await p.$disconnect();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
