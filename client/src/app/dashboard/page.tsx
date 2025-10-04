'use client';

import { PlusCircle, Clock, CheckCircle, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/expense-list';
import { ExpenseForm } from '@/components/expenses/expense-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseSummaryChart } from '@/components/expenses/expense-summary-chart';
import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Expense } from '@/lib/definitions';
import Link from 'next/link';
import { fetchExchangeRates } from '@/lib/currency';

const getAnalytics = (
  expenses: Expense[],
  totalEmployees: number,
  userId: string | undefined,
  companyCurrency: string,
  ratesMap: Record<string, Record<string, number>>
) => {
    const toCompany = (amt: number, cur: string) => {
      if (cur === companyCurrency) return amt;
      const factor = ratesMap[cur]?.[companyCurrency];
      return factor ? amt * factor : amt;
    };

    const pending = expenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + toCompany(e.amount, e.currency), 0);
  
    const approvedThisMonth = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        const today = new Date();
        return (
          e.status === 'approved' &&
          expenseDate.getMonth() === today.getMonth() &&
          expenseDate.getFullYear() === today.getFullYear()
        );
      })
  .reduce((sum, e) => sum + toCompany(e.amount, e.currency), 0);
  
    const byCategory = expenses.reduce(
      (acc, expense) => {
        if (expense.status === 'approved') {
          if (!acc[expense.category]) {
            acc[expense.category] = 0;
          }
          acc[expense.category] += toCompany(expense.amount, expense.currency);
        }
        return acc;
      },
      {} as { [key: string]: number }
    );
  
    const chartData = Object.entries(byCategory).map(([name, total]) => ({
      name,
      total,
    }));

  const myTotalExpenses = expenses.filter(e => e.employee.id === userId).reduce((sum, e) => sum + toCompany(e.amount, e.currency), 0);
    const myPendingExpenses = expenses.filter(e => e.employee.id === userId && e.status === 'pending').length;
    const myApprovedExpenses = expenses.filter(e => e.employee.id === userId && e.status === 'approved').length;
  
    return { pending, approvedThisMonth, chartData, totalEmployees, myTotalExpenses, myPendingExpenses, myApprovedExpenses };
  };

export default function DashboardPage() {
  const { expenses, users, currentUser, addExpense, currentCompany } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ratesMap, setRatesMap] = useState<Record<string, Record<string, number>>>({});

  const companyCurrency = currentCompany?.currency.code ?? 'USD';
  useEffect(() => {
    const bases = Array.from(new Set(expenses.map(e => e.currency)));
    let mounted = true;
    Promise.all(bases.map(async (base) => [base, await fetchExchangeRates(base)] as const))
      .then(entries => {
        if (!mounted) return;
        const next: Record<string, Record<string, number>> = {};
        for (const [base, rates] of entries) next[base] = rates;
        setRatesMap(next);
      })
      .catch(() => mounted && setRatesMap({}));
    return () => { mounted = false; };
  }, [expenses]);

  const { pending, approvedThisMonth, chartData, totalEmployees, myTotalExpenses, myPendingExpenses, myApprovedExpenses } = getAnalytics(expenses, users.length, currentUser?.id, companyCurrency, ratesMap);
  const myExpenses = expenses.filter(e => e.employee.id === currentUser?.id);

  const handleExpenseSubmit = (
    newExpenseData: Omit<Expense, 'id' | 'employee' | 'status'>
  ) => {
    addExpense(newExpenseData);
    setIsFormOpen(false); // Close the dialog
  };

  const renderAdminManagerDashboard = () => (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(pending)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(approvedThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Based on approval date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Currently on the team
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ExpenseSummaryChart data={chartData} />
          </CardContent>
        </Card>
        <div className="lg:col-span-3">
          <ExpenseList
            title="Recent Company Expenses"
            expenses={expenses.slice(0, 5)}
          />
        </div>
      </div>
    </>
  );

  const renderEmployeeDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Total Expenses</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(myTotalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Total of all submitted expenses.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myPendingExpenses}</div>
            <p className="text-xs text-muted-foreground">Number of expenses waiting for approval.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApprovedExpenses}</div>
            <p className="text-xs text-muted-foreground">Number of approved expenses.</p>
          </CardContent>
        </Card>
      </div>
      <div className='pt-4'>
        <ExpenseList
          title="My Recent Expenses"
          expenses={myExpenses.slice(0, 5)}
          showEmployee={false}
        />
        <Button variant="link" asChild className='mt-2'>
            <Link href="/dashboard/my-expenses">View All My Expenses</Link>
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-2xl font-headline font-semibold">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 gap-1 bg-accent hover:bg-accent/90"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Expense
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="font-headline">New Expense</DialogTitle>
              </DialogHeader>
              <ExpenseForm onSubmit={handleExpenseSubmit} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {currentUser?.role === 'employee' ? renderEmployeeDashboard() : renderAdminManagerDashboard()}
    </>
  );
}
