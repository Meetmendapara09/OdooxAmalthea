'use client';
import { ExpenseList } from '@/components/expenses/expense-list';
import { useAppContext } from '@/context/app-context';

export default function ExpensesPage() {
  const { expenses, currentUser } = useAppContext();

  if (currentUser?.role === 'employee') {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-headline font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this page. Please contact your administrator.</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-headline font-semibold">All Company Expenses</h1>
      <ExpenseList title="All Expenses" expenses={expenses} />
    </div>
  );
}
