import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle, XCircle, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/expenses/status-badge';
import type { Expense } from '@/lib/definitions';
import { useEffect, useMemo, useState } from 'react';
import { fetchExchangeRates } from '@/lib/currency';
import { format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import Link from 'next/link';
import { getApprovalProgress, canUserApprove } from '@/lib/approval-utils';
import { Progress } from '@/components/ui/progress';

interface ExpenseListProps {
  title: string;
  expenses: Expense[];
  showEmployee?: boolean;
}

export function ExpenseList({ title, expenses, showEmployee = true }: ExpenseListProps) {
  const { updateExpenseStatus, currentUser, users, currentCompany } = useAppContext();
  const [ratesMap, setRatesMap] = useState<Record<string, Record<string, number>>>({});

  const companyCurrency = currentCompany?.currency.code ?? 'USD';

  useEffect(() => {
    // Fetch rates per unique expense currency (as base) so we can convert to company currency accurately
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

  const canApproveOrReject = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const formatCurrency = (amount: number, currencyCode: string) => {
    if (currencyCode === companyCurrency) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(amount);
    }
    const rates = ratesMap[currencyCode];
    const factor = rates?.[companyCurrency];
    const converted = factor ? amount * factor : amount;
    const convertedStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(converted);
    return `${convertedStr} (${currencyCode})`;
  };

  const getApprovalStatusText = (expense: Expense) => {
    if (!expense.approvalRules) return '';

    const progress = getApprovalProgress(expense, users);
    const { approved, total, required } = progress;

    if (expense.approvalRules.type === 'percentage') {
      return `${approved}/${total} approved (${expense.approvalRules.percentageThreshold}% required)`;
    } else if (expense.approvalRules.type === 'specific_approver') {
      const requiredNames = expense.approvalRules.requiredApprovers?.map(id =>
        users.find(u => u.id === id)?.name
      ).filter(Boolean).join(', ');
      return `${approved}/${required} required approvers approved${requiredNames ? ` (${requiredNames})` : ''}`;
    } else if (expense.approvalRules.type === 'hybrid') {
      const percentageRequired = expense.approvalRules.percentageThreshold
        ? Math.ceil((expense.approvalRules.percentageThreshold / 100) * total)
        : 0;
      const specificNames = expense.approvalRules.requiredApprovers?.map(id =>
        users.find(u => u.id === id)?.name
      ).filter(Boolean).join(', ');
      return `${approved}/${total} approved (${expense.approvalRules.percentageThreshold}% + ${specificNames})`;
    }

    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>{title}</CardTitle>
        <CardDescription>
          {expenses.length} expense(s) found.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showEmployee && <TableHead>Employee</TableHead>}
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Approval Progress</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const progress = getApprovalProgress(expense, users);
              const userCanApprove = currentUser ? canUserApprove(expense, currentUser, users) : false;
              const hasUserApproved = expense.approvals?.some(a => a.approverId === currentUser?.id);

              return (
                <TableRow key={expense.id}>
                  {showEmployee && (
                    <TableCell>
                      <div className="font-medium">{expense.employee.name}</div>
                      <div className="text-sm text-muted-foreground">{expense.category}</div>
                    </TableCell>
                  )}
                  <TableCell className="font-medium max-w-[250px] truncate">{expense.description}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(expense.date), 'MM/dd/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(expense.amount, expense.currency)}</TableCell>
                  <TableCell>
                    <StatusBadge status={expense.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {expense.status === 'pending' && expense.approvalRules && (
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        <div className="text-xs text-muted-foreground">
                          {getApprovalStatusText(expense)}
                        </div>
                        <Progress
                          value={(progress.approved / Math.max(progress.required, 1)) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/expenses/${expense.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        {expense.status === 'pending' && canApproveOrReject && userCanApprove && !hasUserApproved && (
                          <>
                            <DropdownMenuItem onClick={() => updateExpenseStatus(expense.id, 'approved')}>
                              <CheckCircle className="mr-2 h-4 w-4" />Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateExpenseStatus(expense.id, 'rejected')}>
                              <XCircle className="mr-2 h-4 w-4" />Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {hasUserApproved && (
                          <DropdownMenuItem disabled>
                            <Users className="mr-2 h-4 w-4" />Already voted
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
