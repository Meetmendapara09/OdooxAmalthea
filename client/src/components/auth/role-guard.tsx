"use client";

import { useAppContext } from '@/context/app-context';
import React from 'react';

type Allowed = 'admin' | 'manager' | 'employee';

export function RoleGuard({ allow, children, fallback }: { allow: Allowed[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { currentUser } = useAppContext();
  if (!currentUser) return null;
  if (allow.includes(currentUser.role)) return <>{children}</>;
  return fallback ?? null;
}
