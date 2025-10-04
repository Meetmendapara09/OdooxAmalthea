'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Users, UserCheck, UserX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StatusBadge } from '@/components/expenses/status-badge';
import { useAppContext } from '@/context/app-context';
import { getApprovalProgress, canUserApprove } from '@/lib/approval-utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { use } from 'react';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { expenses, users, updateExpenseStatus, currentUser } = useAppContext();
  const expense = expenses.find(e => e.id === id);
  const canApproveOrReject = (currentUser?.role === 'admin' || currentUser?.role === 'manager') && expense?.employee.id !== currentUser.id;

  if (!expense) {
    return (
        <div className="flex flex-col gap-4 items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading expense details...</p>
        </div>
    );
  }

  const progress = getApprovalProgress(expense, users);
  const userCanApprove = currentUser ? canUserApprove(expense, currentUser, users) : false;
  const hasUserApproved = expense.approvals?.some(a => a.approverId === currentUser?.id);

  const getApprovalRuleDescription = () => {
    if (!expense.approvalRules) return 'No approval rules configured';

    switch (expense.approvalRules.type) {
      case 'percentage':
        return `${expense.approvalRules.percentageThreshold}% of approvers must approve`;
      case 'specific_approver':
        const approverNames = expense.approvalRules.requiredApprovers?.map(id =>
          users.find(u => u.id === id)?.name
        ).filter(Boolean).join(', ');
        return `Specific approvers required: ${approverNames}`;
      case 'hybrid':
        const specificNames = expense.approvalRules.requiredApprovers?.map(id =>
          users.find(u => u.id === id)?.name
        ).filter(Boolean).join(', ');
        return `${expense.approvalRules.percentageThreshold}% of approvers AND ${specificNames} must approve`;
      default:
        return 'Unknown rule type';
    }
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-headline font-semibold">Expense Details</h1>
        <div className='ml-auto'>
             <StatusBadge status={expense.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>{expense.description}</CardTitle>
                    <CardDescription>Submitted by {expense.employee.name} on {new Date(expense.date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount)}</p>
                        </div>
                         <div>
                            <p className="text-muted-foreground">Category</p>
                            <p className="font-medium">{expense.category}</p>
                        </div>
                         <div>
                            <p className="text-muted-foreground">Status</p>
                           <div className='flex items-center'>
                             <StatusBadge status={expense.status} />
                           </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Employee</p>
                            <p className="font-medium">{expense.employee.name}</p>
                        </div>
                    </div>
                    {expense.comments && (
                        <div>
                            <p className="text-muted-foreground">Comments</p>
                            <p className="font-medium p-3 bg-muted rounded-md">{expense.comments}</p>
                        </div>
                    )}

                    {expense.status === 'pending' && canApproveOrReject && userCanApprove && !hasUserApproved && (
                        <div className="flex gap-2 pt-4 border-t">
                            <Button className='bg-green-600 hover:bg-green-700' onClick={() => updateExpenseStatus(expense.id, 'approved')}><CheckCircle className='mr-2'/>Approve</Button>
                            <Button variant="destructive" onClick={() => updateExpenseStatus(expense.id, 'rejected')}><XCircle className='mr-2' />Reject</Button>
                        </div>
                    )}

                    {hasUserApproved && (
                        <div className="pt-4 border-t">
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <UserCheck className="h-3 w-3" />
                                You have already voted on this expense
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approval Rules Card */}
            {expense.approvalRules && (
                <Card>
                    <CardHeader>
                        <CardTitle className='font-headline flex items-center gap-2'>
                            <Users className="h-5 w-5" />
                            Approval Rules
                        </CardTitle>
                        <CardDescription>{getApprovalRuleDescription()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expense.status === 'pending' && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{progress.approved} / {progress.required} approvals</span>
                                </div>
                                <Progress value={(progress.approved / Math.max(progress.required, 1)) * 100} className="h-2" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Approval History Card */}
            {expense.approvals && expense.approvals.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className='font-headline'>Approval History</CardTitle>
                        <CardDescription>Review decisions made on this expense</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {expense.approvals.map((approval) => (
                                <div key={approval.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                    <div className={`p-1 rounded-full ${approval.decision === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {approval.decision === 'approved' ? (
                                            <UserCheck className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <UserX className="h-4 w-4 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{approval.approverName}</span>
                                            <Badge variant={approval.decision === 'approved' ? 'default' : 'destructive'} className="text-xs">
                                                {approval.decision}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(approval.timestamp), 'MMM dd, yyyy hh:mm a')}
                                        </p>
                                        {approval.comments && (
                                            <p className="text-sm mt-1">{approval.comments}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
        <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Receipt</CardTitle>
                </CardHeader>
                <CardContent>
                    {expense.receiptUrl ? (
                         <Image src={expense.receiptUrl} alt="Receipt" width={600} height={800} className="rounded-lg" data-ai-hint="receipt document" />
                    ) : (
                        <p className='text-muted-foreground'>No receipt was uploaded.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
