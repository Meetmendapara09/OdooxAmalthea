import type { Expense, Approval, ApprovalRuleApproverStep, User } from './definitions';

export interface ApprovalSequenceEntry {
  step: ApprovalRuleApproverStep;
  user: User | null;
  approval?: Approval;
  completed: boolean;
  pending: boolean;
}

function normaliseSequentialSteps(expense: Expense): ApprovalRuleApproverStep[] {
  const sequence = expense.approvalRules?.approverSequence ?? [];
  if (sequence.length) {
    return [...sequence]
      .map((step, index) => ({
        approverId: step.approverId,
        order: step.order ?? index,
        required: step.required ?? true,
        type: step.type,
        label: step.label,
      }))
      .filter((step, index, arr) =>
        arr.findIndex(candidate => candidate.approverId === step.approverId && candidate.order === step.order) === index
      )
      .sort((a, b) => a.order - b.order);
  }

  const legacyApprovers = expense.approvalRules?.requiredApprovers ?? [];
  if (legacyApprovers.length) {
    return legacyApprovers.map((id, index) => ({ approverId: id, order: index, required: true }));
  }

  return [];
}

function approvalsByApprover(expense: Expense): Map<string, Approval> {
  const map = new Map<string, Approval>();
  for (const approval of expense.approvals ?? []) {
    map.set(approval.approverId, approval);
  }
  return map;
}

function isStepRequired(step: ApprovalRuleApproverStep): boolean {
  return step.required !== false;
}

export function getApprovalSequence(expense: Expense, allUsers: User[]): ApprovalSequenceEntry[] {
  const steps = normaliseSequentialSteps(expense);
  const approvalMap = approvalsByApprover(expense);

  return steps.map(step => {
    const approval = approvalMap.get(step.approverId);
    const user = allUsers.find(u => u.id === step.approverId) ?? null;
    return {
      step,
      user,
      approval,
      completed: Boolean(approval),
      pending: !approval,
    };
  });
}

export function getNextSequentialApproverId(expense: Expense): string | null {
  if (!expense.approvalRules?.sequential) {
    return null;
  }

  const steps = normaliseSequentialSteps(expense);
  if (!steps.length) {
    return null;
  }

  const approvalMap = approvalsByApprover(expense);
  for (const step of steps) {
    const approval = approvalMap.get(step.approverId);
    if (!approval) {
      return step.approverId;
    }
    if (approval.decision === 'rejected') {
      return null;
    }
  }

  return null;
}

export function evaluateApprovalRules(expense: Expense, allUsers: User[]): 'approved' | 'rejected' | 'pending' {
  const rules = expense.approvalRules;
  if (!rules) {
    const approvals = expense.approvals ?? [];
    if (!approvals.length) {
      return 'pending';
    }
    if (approvals.some(approval => approval.decision === 'rejected')) {
      return 'rejected';
    }
    return approvals.some(approval => approval.decision === 'approved') ? 'approved' : 'pending';
  }

  const approvals = expense.approvals ?? [];
  if (approvals.some(approval => approval.decision === 'rejected')) {
    return 'rejected';
  }

  const approvalMap = approvalsByApprover(expense);
  const steps = normaliseSequentialSteps(expense);
  if (rules.sequential && steps.length) {
    const requiredSteps = steps.filter(isStepRequired);
    const allRequiredApproved = requiredSteps.every(step => approvalMap.get(step.approverId)?.decision === 'approved');
    if (!allRequiredApproved) {
      return 'pending';
    }
  }

  const eligibleApprovers = getEligibleApprovers(expense, allUsers);
  const approvedCount = approvals.filter(approval => approval.decision === 'approved').length;

  const threshold = rules.percentageThreshold;
  const percentageRequired = threshold ? Math.ceil((threshold / 100) * Math.max(eligibleApprovers.length, 1)) : null;
  const percentageMet = percentageRequired !== null ? approvedCount >= percentageRequired : false;

  const requiredApprovers = rules.requiredApprovers ?? [];
  const specificMet = requiredApprovers.length
    ? requiredApprovers.every(approverId => approvalMap.get(approverId)?.decision === 'approved')
    : false;

  switch (rules.type) {
    case 'percentage':
      return percentageMet ? 'approved' : 'pending';
    case 'specific_approver':
      return specificMet ? 'approved' : 'pending';
    case 'hybrid':
      return percentageMet || specificMet ? 'approved' : 'pending';
    default:
      return 'pending';
  }
}

export function getEligibleApprovers(expense: Expense, allUsers: User[]): User[] {
  const steps = normaliseSequentialSteps(expense);
  if (steps.length) {
    const ids = new Set(steps.map(step => step.approverId));
    const users = allUsers.filter(user => ids.has(user.id));
    if (users.length) {
      return users;
    }
  }

  if (expense.approvalRules?.requiredApprovers?.length) {
    const requiredIds = new Set(expense.approvalRules.requiredApprovers);
    return allUsers.filter(user => requiredIds.has(user.id));
  }

  return allUsers.filter(user => user.role === 'manager' || user.role === 'admin');
}

export function canUserApprove(expense: Expense, user: User, allUsers: User[]): boolean {
  if (expense.status !== 'pending') {
    return false;
  }

  const steps = normaliseSequentialSteps(expense);
  if (expense.approvalRules?.sequential && steps.length) {
    const approvalMap = approvalsByApprover(expense);
    for (const step of steps) {
      const approval = approvalMap.get(step.approverId);
      if (!approval) {
        return step.approverId === user.id;
      }
      if (approval.decision === 'rejected') {
        return false;
      }
    }
    return false;
  }

  if (expense.approvalRules?.requiredApprovers?.length) {
    return expense.approvalRules.requiredApprovers.includes(user.id);
  }

  const eligibleApprovers = getEligibleApprovers(expense, allUsers);
  return eligibleApprovers.some(approver => approver.id === user.id);
}

export function getApprovalProgress(expense: Expense, allUsers: User[]): { approved: number; total: number; required: number } {
  if (!expense.approvalRules) {
    return { approved: 0, total: 0, required: 0 };
  }

  const steps = normaliseSequentialSteps(expense);
  if (expense.approvalRules.sequential && steps.length) {
    const approvalMap = approvalsByApprover(expense);
    const requiredSteps = steps.filter(isStepRequired);
    const approvedRequired = requiredSteps.filter(step => approvalMap.get(step.approverId)?.decision === 'approved').length;
    return {
      approved: approvedRequired,
      total: steps.length,
      required: requiredSteps.length,
    };
  }

  const eligibleApprovers = getEligibleApprovers(expense, allUsers);
  const approvedCount = expense.approvals?.filter(approval => approval.decision === 'approved').length ?? 0;

  let required = 0;
  switch (expense.approvalRules.type) {
    case 'percentage':
      if (expense.approvalRules.percentageThreshold) {
        required = Math.ceil((expense.approvalRules.percentageThreshold / 100) * Math.max(eligibleApprovers.length, 1));
      }
      break;
    case 'specific_approver':
      required = expense.approvalRules.requiredApprovers?.length ?? 0;
      break;
    case 'hybrid': {
      const percentageRequired = expense.approvalRules.percentageThreshold
        ? Math.ceil((expense.approvalRules.percentageThreshold / 100) * Math.max(eligibleApprovers.length, 1))
        : 0;
      const specificRequired = expense.approvalRules.requiredApprovers?.length ?? 0;
      required = Math.max(percentageRequired, specificRequired);
      break;
    }
    default:
      required = 0;
  }

  return {
    approved: approvedCount,
    total: eligibleApprovers.length,
    required,
  };
}