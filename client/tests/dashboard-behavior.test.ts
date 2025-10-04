import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardTitle } from '../src/lib/roles';
import { getTeamMembers } from '../src/lib/company';
import type { User } from '../src/lib/definitions';

test('getDashboardTitle returns role-specific labels', () => {
  assert.equal(getDashboardTitle('admin'), "Admin's Dashboard");
  assert.equal(getDashboardTitle('manager'), "Manager's Dashboard");
  assert.equal(getDashboardTitle('employee'), "Employee's Dashboard");
  assert.equal(getDashboardTitle(undefined), 'Dashboard');
});

test('getTeamMembers excludes the current user and reports zero colleagues', () => {
  const users: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', avatarUrl: '', companyId: 'c1' },
    { id: '2', name: 'Manager Mike', email: 'manager@example.com', role: 'manager', avatarUrl: '', companyId: 'c1' },
    { id: '3', name: 'Employee Emma', email: 'emma@example.com', role: 'employee', avatarUrl: '', companyId: 'c1' },
  ];

  const adminPerspective = getTeamMembers(users, '1');
  assert.equal(adminPerspective.length, 2);
  assert(adminPerspective.every(user => user.id !== '1'));

  const brandNewAdminPerspective = getTeamMembers([
    { id: '10', name: 'Solo Admin', email: 'solo@example.com', role: 'admin', avatarUrl: '', companyId: 'new' },
  ], '10');
  assert.equal(brandNewAdminPerspective.length, 0);
});
