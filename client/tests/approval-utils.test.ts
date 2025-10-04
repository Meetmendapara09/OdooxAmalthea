import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateApprovalRules } from '../src/lib/approval-utils';
import type { Expense } from '../src/lib/definitions';

const baseExpense: Expense = {
  id: 'exp-1',
  description: 'Test Expense',
  amount: 100,
  currency: 'USD',
  category: 'Meals',
  date: new Date().toISOString(),
  status: 'pending',
  employee: { id: 'emp-1', name: 'Employee One' },
};

test('evaluateApprovalRules approves expense without rules when a manager approves', () => {
  const result = evaluateApprovalRules({
    ...baseExpense,
    approvals: [
      {
        id: 'app-1',
        expenseId: 'exp-1',
        approverId: 'mgr-1',
        approverName: 'Manager',
        decision: 'approved',
        timestamp: new Date().toISOString(),
      },
    ],
  }, []);

  assert.equal(result, 'approved');
});

test('evaluateApprovalRules keeps pending when no approvals exist', () => {
  const result = evaluateApprovalRules({
    ...baseExpense,
    approvals: [],
  }, []);

  assert.equal(result, 'pending');
});

test('evaluateApprovalRules returns rejected when any approval rejects', () => {
  const result = evaluateApprovalRules({
    ...baseExpense,
    approvals: [
      {
        id: 'app-2',
        expenseId: 'exp-1',
        approverId: 'mgr-1',
        approverName: 'Manager',
        decision: 'rejected',
        timestamp: new Date().toISOString(),
      },
    ],
  }, []);

  assert.equal(result, 'rejected');
});
