'use client';

import { ExpenseList } from '@/components/expenses/expense-list';
import { useAppContext } from '@/context/app-context';

export default function MyExpensesPage() {
  const { expenses, currentUser } = useAppContext();
  
  // Filter expenses for the current user
  const myExpenses = expenses.filter(e => e.employee.id === currentUser?.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-headline font-semibold">My Expenses</h1>
      <ExpenseList title="My Submitted Expenses" expenses={myExpenses} showEmployee={false} />
    </div>
  );
}
