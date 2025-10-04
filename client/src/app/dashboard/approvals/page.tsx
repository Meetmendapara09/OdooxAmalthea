'use client';

import { ExpenseList } from '@/components/expenses/expense-list';
import { useAppContext } from '@/context/app-context';
import { RoleGuard } from '@/components/auth/role-guard';
import { canUserApprove } from '@/lib/approval-utils';

export default function ApprovalsPage() {
  const { expenses, currentUser, users } = useAppContext();

  // In a real app, this might be more complex, e.g., filtering expenses for a manager's direct reports.
  // For now, we'll show all pending expenses to any manager or admin.
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const actionableExpenses = currentUser
    ? pendingExpenses.filter(expense => canUserApprove(expense, currentUser, users))
    : [];
  const remainingExpenses = pendingExpenses.filter(expense => !actionableExpenses.some(a => a.id === expense.id));

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
        <ExpenseList title="Needs your review" expenses={actionableExpenses} />
        {remainingExpenses.length > 0 && (
          <ExpenseList title="Awaiting other approvers" expenses={remainingExpenses} />
        )}
      </div>
    </RoleGuard>
  );
}
