'use client';

import { ExpenseList } from '@/components/expenses/expense-list';
import { useAppContext } from '@/context/app-context';
import { RoleGuard } from '@/components/auth/role-guard';

export default function ApprovalsPage() {
  const { expenses } = useAppContext();

  // In a real app, this might be more complex, e.g., filtering expenses for a manager's direct reports.
  // For now, we'll show all pending expenses to any manager or admin.
  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  return (
    <RoleGuard
      allow={["admin", "manager"]}
      fallback={
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-headline font-semibold">Approvals</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-semibold">Expense Approvals</h1>
        <p className="text-muted-foreground">Review and approve or reject expenses submitted by your team.</p>
        <ExpenseList title="Pending Review" expenses={pendingExpenses} />
      </div>
    </RoleGuard>
  );
}
