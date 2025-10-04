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
  addExpense: (expenseData: Omit<Expense, 'id' | 'employee' | 'status'>) => void;
  updateExpenseStatus: (expenseId: string, decision: 'approved' | 'rejected', comments?: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  addUser: (userData: Omit<User, 'id' | 'avatarUrl'>) => void;
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
        setUsers(usersData);
        setExpenses(expensesData);
        setCompanies(companiesData);
        // Derive approvals from expenses
        const approvals: Approval[] = expensesData.flatMap(e => e.approvals ?? []);
        setApprovals(approvals);
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
        setCurrentUser(chosen);
      } catch (e) {
        console.error('Failed to load data from API', e);
      }
    };
    load();
  }, [session?.user]);

  // Derive current company from currentUser.companyId
  const currentCompany = companies.find(c => c.id === currentUser?.companyId) ?? companies[0] ?? null;

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
  
  const updateExpenseStatus = async (expenseId: string, decision: 'approved' | 'rejected', comments?: string) => {
    if (!currentUser) return;

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Client-side guard
    if (!canUserApprove(expense, currentUser, users)) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: currentUser.id, decision, comments }),
      });
      if (!res.ok) {
        console.error('Failed to update expense status', await res.text());
        return;
      }
      const updated: Expense = await res.json();
      setExpenses(prev => prev.map(e => (e.id === updated.id ? updated : e)));
      // Update approvals cache
      const newApprovals: Approval[] = (updated.approvals ?? []);
      setApprovals(prev => {
        const others = prev.filter(a => a.expenseId !== updated.id);
        return [...others, ...newApprovals];
      });
    } catch (e) {
      console.error('Failed to update expense status', e);
    }
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role } : user
      )
    );
    // You might also want to update the currentUser if they are editing themselves
  };

  const addUser = (userData: Omit<User, 'id' | 'avatarUrl'>) => {
    const newUser: User = {
        ...userData,
        id: `u${users.length + 1}`,
        avatarUrl: `https://picsum.photos/seed/${users.length + 1}/100/100`,
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
  };


  const value = {
    expenses,
    users,
    approvals,
    currentUser,
    companies,
    currentCompany,
    addExpense,
    updateExpenseStatus,
    updateUserRole,
    addUser,
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
