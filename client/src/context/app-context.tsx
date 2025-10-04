'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Expense, User, UserRole, Approval, Company } from '@/lib/definitions';
import { canUserApprove } from '@/lib/approval-utils';
import { useSession } from 'next-auth/react';

interface AppContextType {
  expenses: Expense[];
  users: User[];
  approvals: Approval[];
  currentUser: User | null; // Assuming a single logged-in user for now
  companies: Company[];
  currentCompany: Company | null;
  addExpense: (expenseData: Omit<Expense, 'id' | 'employee' | 'status'>) => Promise<void>;
  updateExpenseStatus: (expenseId: string, decision: 'approved' | 'rejected', comments?: string) => Promise<void>;
  inviteUser: (input: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    managerId?: string | null;
  }) => Promise<User>;
  updateUser: (userId: string, updates: { role?: UserRole; managerId?: string | null }) => Promise<User>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // In a real auth scenario, this would be determined by the session.
  // For now, pick the first admin (fallback to first manager, then first user) from DB.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, expensesRes, companiesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/expenses'),
          fetch('/api/companies'),
        ]);
        const usersData: User[] = await usersRes.json();
        const expensesData: Expense[] = await expensesRes.json();
        const companiesData: Company[] = await companiesRes.json();
        // Choose a current user: prefer the authenticated session user
        let chosen: User | null = null;
        const sessionEmail = (session?.user as any)?.email as string | undefined;
        if (sessionEmail) {
          chosen = usersData.find(u => u.email === sessionEmail) ?? null;
        }
        if (!chosen) {
          const admin = usersData.find(u => u.role === 'admin');
          const manager = usersData.find(u => u.role === 'manager');
          chosen = admin ?? manager ?? usersData[0] ?? null;
        }

        const companyUsers = chosen?.companyId
          ? usersData.filter(u => u.companyId === chosen?.companyId)
          : usersData;
        const companyUserIds = new Set(companyUsers.map(u => u.id));
        const companyExpenses = chosen?.companyId
          ? expensesData.filter(e => companyUserIds.has(e.employee.id))
          : expensesData;
        const companyApprovals: Approval[] = companyExpenses.flatMap(e => e.approvals ?? []);
        const companyList = chosen?.companyId
          ? companiesData.filter(c => c.id === chosen.companyId)
          : companiesData;

        setUsers(companyUsers);
        setExpenses(companyExpenses);
        setCompanies(companyList.length ? companyList : companiesData);
        setApprovals(companyApprovals);
        setCurrentUser(chosen);
      } catch (e) {
        console.error('Failed to load data from API', e);
      }
    };
    load();
  }, [session?.user]);

  // Derive current company from currentUser.companyId
  const currentCompany = companies.find(c => c.id === currentUser?.companyId) ?? companies[0] ?? null;

  const parseErrorResponse = async (res: Response) => {
    try {
      const data = await res.json();
      if (typeof data === 'object' && data && 'error' in data) {
        return String((data as { error: unknown }).error);
      }
      return JSON.stringify(data);
    } catch {
      return await res.text();
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'employee' | 'status'>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseData.description,
          amount: expenseData.amount,
          currency: expenseData.currency,
          category: expenseData.category,
          date: expenseData.date, // ISO string
          employeeId: currentUser.id,
          comments: expenseData.comments ?? undefined,
          receiptUrl: expenseData.receiptUrl ?? undefined,
          approvalRules: (expenseData as any).approvalRules ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Expense = await res.json();
      setExpenses(prev => [created, ...prev]);
    } catch (e) {
      console.error('Failed to add expense', e);
    }
  };
  
  const updateExpenseStatus = async (
    expenseId: string,
    decision: 'approved' | 'rejected',
    comments?: string,
  ) => {

    if (!currentUser) {
      throw new Error('You must be signed in to take action on an expense.');
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      throw new Error('Expense not found.');
    }

    // Client-side guard
    if (!canUserApprove(expense, currentUser, users)) {
      throw new Error('You are not allowed to approve this expense right now.');
    }

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: currentUser.id, decision, comments }),
      });
      if (!res.ok) {
        const message = await parseErrorResponse(res);
        throw new Error(message || 'Failed to update expense status');
      }
      const updated: Expense = await res.json();
      setExpenses(prev => prev.map(e => (e.id === updated.id ? updated : e)));
      // Update approvals cache
      const newApprovals: Approval[] = updated.approvals ?? [];
      setApprovals(prev => {
        const others = prev.filter(a => a.expenseId !== updated.id);
        return [...others, ...newApprovals];
      });
      return;
    } catch (e) {
      console.error('Failed to update expense status', e);
      if (e instanceof Error) {
        throw e;
      }
      throw new Error('Failed to update expense status');
    }
  };

  const inviteUser = async (input: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    managerId?: string | null;
  }): Promise<User> => {
    if (!currentCompany) {
      throw new Error('No company selected');
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          companyId: currentCompany.id,
          managerId: input.role === 'employee' ? input.managerId ?? null : null,
        }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorResponse(res));
      }
      const created: User = await res.json();
      setUsers(prev => [...prev, created]);
      return created;
    } catch (error: any) {
      console.error('Failed to invite user', error);
      const message = error?.message ?? 'Unable to invite user';
      throw new Error(message);
    }
  };

  const updateUser = async (userId: string, updates: { role?: UserRole; managerId?: string | null }) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        throw new Error(await parseErrorResponse(res));
      }
      const updated: User = await res.json();
      setUsers(prev => prev.map(user => (user.id === userId ? { ...user, ...updated } : user)));
      if (currentUser?.id === userId) {
        setCurrentUser(updated);
      }
      return updated;
    } catch (error: any) {
      console.error('Failed to update user', error);
      const message = error?.message ?? 'Unable to update user';
      throw new Error(message);
    }
  };

  const value: AppContextType = {
    expenses,
    users,
    approvals,
    currentUser,
    companies,
    currentCompany,
    addExpense,
    updateExpenseStatus,
    inviteUser,
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
