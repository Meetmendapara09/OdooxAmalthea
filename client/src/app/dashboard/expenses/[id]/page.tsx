'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StatusBadge } from '@/components/expenses/status-badge';
import { useAppContext } from '@/context/app-context';
import { getApprovalProgress, canUserApprove, getApprovalSequence } from '@/lib/approval-utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { use, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
    const { expenses, users, updateExpenseStatus, currentUser } = useAppContext();
    const { toast } = useToast();
  const expense = expenses.find(e => e.id === id);
  const canApproveOrReject = (currentUser?.role === 'admin' || currentUser?.role === 'manager') && expense?.employee.id !== currentUser.id;
    const [actionModal, setActionModal] = useState<{ decision: 'approved' | 'rejected' } | null>(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

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
    const sequence = expense.approvalRules?.sequential ? getApprovalSequence(expense, users) : [];

    const openActionModal = (decision: 'approved' | 'rejected') => {
        setActionModal({ decision });
        setComment('');
        setActionError(null);
    };

    const closeActionModal = () => {
        if (submitting) return;
        setActionModal(null);
        setComment('');
        setActionError(null);
    };

    const submitDecision = async () => {
        if (!actionModal) return;
        if (actionModal.decision === 'rejected' && !comment.trim()) {
            setActionError('Please add a comment when rejecting an expense.');
            return;
        }
        setSubmitting(true);
        try {
            await updateExpenseStatus(expense.id, actionModal.decision, comment.trim() ? comment.trim() : undefined);
            toast({
                title: actionModal.decision === 'approved' ? 'Expense approved' : 'Expense rejected',
                description: `"${expense.description}" has been ${actionModal.decision}.`,
            });
            closeActionModal();
        } catch (error: any) {
            const message = error?.message ?? 'Unable to record your decision. Please try again.';
            setActionError(message);
            toast({
                variant: 'destructive',
                title: 'Unable to submit decision',
                description: message,
            });
        } finally {
            setSubmitting(false);
        }
    };

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
        <>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/expenses">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-headline font-semibold">Expense Details</h1>
                    <div className="ml-auto">
                        <StatusBadge status={expense.status} />
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">{expense.description}</CardTitle>
                                <CardDescription>
                                    Submitted by {expense.employee.name} on {new Date(expense.date).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Amount</p>
                                        <p className="text-lg font-medium">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Category</p>
                                        <p className="font-medium">{expense.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <div className="flex items-center">
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
                                        <p className="rounded-md bg-muted p-3 font-medium">{expense.comments}</p>
                                    </div>
                                )}

                                {expense.status === 'pending' && canApproveOrReject && userCanApprove && !hasUserApproved && (
                                    <div className="flex gap-2 border-t pt-4">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => openActionModal('approved')}
                                        >
                                            <CheckCircle className="mr-2" />Approve
                                        </Button>
                                        <Button variant="destructive" onClick={() => openActionModal('rejected')}>
                                            <XCircle className="mr-2" />Reject
                                        </Button>
                                    </div>
                                )}

                                {hasUserApproved && (
                                    <div className="border-t pt-4">
                                        <Badge variant="secondary" className="flex w-fit items-center gap-1">
                                            <UserCheck className="h-3 w-3" />
                                            You have already voted on this expense
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {expense.approvalRules && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 font-headline">
                                        <Users className="h-5 w-5" />
                                        Approval Rules
                                    </CardTitle>
                                    <CardDescription>{getApprovalRuleDescription()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Progress</span>
                                                <span>
                                                    {progress.approved} / {Math.max(progress.required, sequence.length || progress.required || 1)} approvals
                                                </span>
                                            </div>
                                            <Progress
                                                value={(progress.approved / Math.max(progress.required || sequence.length || 1, 1)) * 100}
                                                className="h-2"
                                            />
                                        </div>
                                        {sequence.length > 0 && (
                                            <div className="space-y-3">
                                                {sequence.map((entry, index) => (
                                                    <div key={entry.step.approverId} className="flex items-start gap-3 rounded-md border p-3">
                                                        <div
                                                            className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                                                entry.approval
                                                                    ? entry.approval.decision === 'approved'
                                                                        ? 'bg-green-500'
                                                                        : 'bg-destructive'
                                                                    : 'bg-muted-foreground/60'
                                                            }`}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">Step {index + 1}</Badge>
                                                                <span className="font-medium">{entry.user?.name ?? entry.step.label ?? 'Approver'}</span>
                                                            </div>
                                                            {entry.approval ? (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {entry.approval.decision === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                                                                    {format(new Date(entry.approval.timestamp), 'MMM dd, yyyy hh:mm a')}
                                                                </p>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">Awaiting decision</p>
                                                            )}
                                                            {entry.approval?.comments && (
                                                                <p className="mt-1 text-sm">{entry.approval.comments}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {expense.approvals && expense.approvals.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">Approval History</CardTitle>
                                    <CardDescription>Review decisions made on this expense</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {expense.approvals.map((approval) => (
                                            <div key={approval.id} className="flex items-start gap-3 rounded-lg border p-3">
                                                <div className={`rounded-full p-1 ${approval.decision === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {approval.decision === 'approved' ? (
                                                        <UserCheck className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <UserX className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{approval.approverName}</span>
                                                        <Badge
                                                            variant={approval.decision === 'approved' ? 'default' : 'destructive'}
                                                            className="text-xs"
                                                        >
                                                            {approval.decision}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(approval.timestamp), 'MMM dd, yyyy hh:mm a')}
                                                    </p>
                                                    {approval.comments && <p className="mt-1 text-sm">{approval.comments}</p>}
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
                                <CardTitle className="font-headline">Receipt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {expense.receiptUrl ? (
                                    <Image
                                        src={expense.receiptUrl}
                                        alt="Receipt"
                                        width={600}
                                        height={800}
                                        className="rounded-lg"
                                        data-ai-hint="receipt document"
                                    />
                                ) : (
                                    <p className="text-muted-foreground">No receipt was uploaded.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={!!actionModal} onOpenChange={(open) => { if (!open) closeActionModal(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{actionModal?.decision === 'approved' ? 'Approve expense' : 'Reject expense'}</DialogTitle>
                        <DialogDescription>
                            {actionModal?.decision === 'approved'
                                ? 'Add a note for the employee before approving.'
                                : 'Share why you are rejecting this expense so the employee can follow up.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {actionError && (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 h-4 w-4" />
                                <span>{actionError}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="decision-comment">Comment</Label>
                            <Textarea
                                id="decision-comment"
                                placeholder="Share context about your decision"
                                rows={4}
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                            />
                            {actionModal?.decision === 'rejected' && (
                                <p className="text-xs text-muted-foreground">Comments are required when rejecting an expense.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={closeActionModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitDecision}
                            disabled={submitting}
                            className={actionModal?.decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : undefined}
                        >
                            {submitting ? 'Submitting…' : actionModal?.decision === 'approved' ? 'Approve' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
