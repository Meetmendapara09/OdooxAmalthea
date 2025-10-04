import type { Expense, Approval, ApprovalRule, User } from './definitions';

export function evaluateApprovalRules(expense: Expense, allUsers: User[]): 'approved' | 'rejected' | 'pending' {
  if (!expense.approvalRules || !expense.approvals) {
    return 'pending';
  }

  const { approvalRules, approvals } = expense;
  // If sequential is in effect, enforce order by requiring earlier approvers to have acted before later ones count.
  if (approvalRules.sequential && approvalRules.requiredApprovers && approvalRules.requiredApprovers.length > 1) {
    // Build a map of approvals by approverId
    const approvedIds = new Set(approvals.filter(a => a.decision === 'approved').map(a => a.approverId));
    for (let i = 0; i < approvalRules.requiredApprovers.length; i++) {
      const approverId = approvalRules.requiredApprovers[i];
      if (!approvedIds.has(approverId)) {
        // If a later approver approved but earlier hasn't, treat as pending until order is satisfied
        break;
      }
    }
  }
  const totalApprovers = getEligibleApprovers(expense, allUsers).length;
  const approvedCount = approvals.filter(a => a.decision === 'approved').length;
  const rejectedCount = approvals.filter(a => a.decision === 'rejected').length;

  // If anyone rejected, it's rejected (for now - could be configurable)
  if (rejectedCount > 0) {
    return 'rejected';
  }

  switch (approvalRules.type) {
    case 'percentage':
      if (approvalRules.percentageThreshold) {
        const requiredApprovals = Math.ceil((approvalRules.percentageThreshold / 100) * totalApprovers);
        return approvedCount >= requiredApprovals ? 'approved' : 'pending';
      }
      break;

    case 'specific_approver':
      if (approvalRules.requiredApprovers) {
        const hasAllRequiredApprovals = approvalRules.requiredApprovers.every(approverId =>
          approvals.some(a => a.approverId === approverId && a.decision === 'approved')
        );
        return hasAllRequiredApprovals ? 'approved' : 'pending';
      }
      break;

    case 'hybrid':
      if (approvalRules.percentageThreshold && approvalRules.requiredApprovers) {
        // For hybrid, both conditions must be met
        const percentageMet = approvedCount >= Math.ceil((approvalRules.percentageThreshold / 100) * totalApprovers);
        const specificApproversMet = approvalRules.requiredApprovers.every(approverId =>
          approvals.some(a => a.approverId === approverId && a.decision === 'approved')
        );
        return percentageMet && specificApproversMet ? 'approved' : 'pending';
      }
      break;
  }

  return 'pending';
}

export function getEligibleApprovers(expense: Expense, allUsers: User[]): User[] {
  // For now, all managers and admins can approve
  // In a real app, this might be based on hierarchy, department, etc.
  return allUsers.filter(user => user.role === 'manager' || user.role === 'admin');
}

export function canUserApprove(expense: Expense, user: User, allUsers: User[]): boolean {
  if (expense.status !== 'pending') return false;

  const eligibleApprovers = getEligibleApprovers(expense, allUsers);
  return eligibleApprovers.some(approver => approver.id === user.id);
}

export function getApprovalProgress(expense: Expense, allUsers: User[]): { approved: number; total: number; required: number } {
  if (!expense.approvalRules) {
    return { approved: 0, total: 0, required: 0 };
  }

  const eligibleApprovers = getEligibleApprovers(expense, allUsers);
  const approvedCount = expense.approvals?.filter(a => a.decision === 'approved').length || 0;

  let required = 0;

  switch (expense.approvalRules.type) {
    case 'percentage':
      if (expense.approvalRules.percentageThreshold) {
        required = Math.ceil((expense.approvalRules.percentageThreshold / 100) * eligibleApprovers.length);
      }
      break;
    case 'specific_approver':
      required = expense.approvalRules.requiredApprovers?.length || 0;
      break;
    case 'hybrid':
      // For hybrid, show the maximum of the two requirements
      const percentageRequired = expense.approvalRules.percentageThreshold
        ? Math.ceil((expense.approvalRules.percentageThreshold / 100) * eligibleApprovers.length)
        : 0;
      const specificRequired = expense.approvalRules.requiredApprovers?.length || 0;
      required = Math.max(percentageRequired, specificRequired);
      break;
  }

  return {
    approved: approvedCount,
    total: eligibleApprovers.length,
    required
  };
}