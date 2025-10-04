import type { User, Company, Expense, Approval, ApprovalRule } from './definitions';

export const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@expenseasy.com', role: 'admin', avatarUrl: 'https://picsum.photos/seed/1/100/100' },
  { id: '2', name: 'Manager Mike', email: 'manager@expenseasy.com', role: 'manager', avatarUrl: 'https://picsum.photos/seed/2/100/100' },
  { id: '3', name: 'Employee Emma', email: 'employee@expenseasy.com', role: 'employee', avatarUrl: 'https://picsum.photos/seed/3/100/100' },
  { id: '4', name: 'CFO Carol', email: 'cfo@expenseasy.com', role: 'manager', avatarUrl: 'https://picsum.photos/seed/4/100/100' },
];

export const mockCompany: Company = {
  id: 'c1',
  name: 'Innovate Inc.',
  currency: { code: 'USD', name: 'United States dollar', symbol: '$' },
};

export const mockApprovals: Approval[] = [
  {
    id: 'a1',
    expenseId: 'e1',
    approverId: '2',
    approverName: 'Manager Mike',
    decision: 'approved',
    timestamp: '2023-10-27T10:00:00.000Z',
    comments: 'Looks good!',
  },
  {
    id: 'a2',
    expenseId: 'e5',
    approverId: '2',
    approverName: 'Manager Mike',
    decision: 'approved',
    timestamp: '2023-10-16T14:00:00.000Z',
  },
];

export const mockExpenses: Expense[] = [
  {
    id: 'e1',
    description: 'Client Dinner at The Grand Bistro',
    amount: 150.75,
    currency: 'USD',
    category: 'Meals & Entertainment',
    date: '2023-10-26T19:00:00.000Z',
    status: 'approved',
    employee: { id: '3', name: 'Employee Emma' },
    comments: 'Approved by Manager Mike.',
    approvalRules: {
      type: 'percentage',
      percentageThreshold: 50,
    },
    approvals: [mockApprovals[0]],
  },
  {
    id: 'e2',
    description: 'Flight to New York for conference',
    amount: 450.00,
    currency: 'USD',
    category: 'Travel',
    date: '2023-10-22T08:30:00.000Z',
    status: 'pending',
    employee: { id: '3', name: 'Employee Emma' },
    approvalRules: {
      type: 'specific_approver',
      requiredApprovers: ['4'], // CFO Carol
    },
  },
  {
    id: 'e3',
    description: 'Software Subscription (Monthly)',
    amount: 29.99,
    currency: 'USD',
    category: 'Software',
    date: '2023-10-20T12:00:00.000Z',
    status: 'rejected',
    employee: { id: '3', name: 'Employee Emma' },
    comments: 'This should be on the corporate card, not personal expense.',
    approvalRules: {
      type: 'percentage',
      percentageThreshold: 75,
    },
  },
    {
    id: 'e4',
    description: 'Team Lunch',
    amount: 85.50,
    currency: 'EUR',
    category: 'Meals & Entertainment',
    date: '2023-10-18T13:00:00.000Z',
    status: 'pending',
    employee: { id: '3', name: 'Employee Emma' },
    approvalRules: {
      type: 'hybrid',
      percentageThreshold: 60,
      requiredApprovers: ['2'], // Manager Mike
    },
  },
  {
    id: 'e5',
    description: 'Office Supplies from Staples',
    amount: 55.20,
    currency: 'USD',
    category: 'Office Supplies',
    date: '2023-10-15T15:45:00.000Z',
    status: 'approved',
    employee: { id: '3', name: 'Employee Emma' },
    approvalRules: {
      type: 'percentage',
      percentageThreshold: 50,
    },
    approvals: [mockApprovals[1]],
  },
];
