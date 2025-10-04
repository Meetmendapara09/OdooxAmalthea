export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  companyId?: string | null;
  managerId?: string | null;
}

export interface Company {
  id: string;
  name:string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalRuleType = 'percentage' | 'specific_approver' | 'hybrid';

export interface ApprovalRuleApproverStep {
  approverId: string;
  order: number;
  required: boolean;
  type?: 'manager' | 'user';
  label?: string;
}

export interface ApprovalRule {
  type: ApprovalRuleType;
  percentageThreshold?: number; // For percentage and hybrid rules
  requiredApprovers?: string[]; // User IDs for specific_approver and hybrid rules
  approverSequence?: ApprovalRuleApproverStep[]; // Ordered approvers for sequential flows
  // Derived from policy/editor
  managerFirst?: boolean;
  sequential?: boolean;
  // For hybrid: both conditions must be met (percentage AND specific approvers)
}

export interface Approval {
  id: string;
  expenseId: string;
  approverId: string;
  approverName: string;
  decision: 'approved' | 'rejected';
  timestamp: string;
  comments?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string; // ISO 8601 format
  status: ExpenseStatus;
  employee: {
    id: string;
    name: string;
  };
  comments?: string;
  receiptUrl?: string;
  approvalRules?: ApprovalRule;
  approvals?: Approval[];
}

export interface ApprovalPolicyApproverDTO {
  approverId: string;
  required: boolean;
  order: number;
  label?: string;
}

export interface ApprovalPolicyDTO {
  id?: string;
  companyId: string;
  userId?: string | null;
  category?: string | null;
  description?: string;
  isManagerApprover: boolean;
  managerFirst: boolean;
  sequential: boolean;
  minApprovalPercentage?: number | null;
  approvers: ApprovalPolicyApproverDTO[];
}

export interface Country {
  name: {
    common: string;
  };
  currencies: {
    [key: string]: {
      name: string;
      symbol: string;
    };
  };
}
