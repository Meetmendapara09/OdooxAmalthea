'use client'

import Link from 'next/link';
import {
  Home,
  ScanLine,
  FileText,
  Users,
  Settings,
  Briefcase,
  CheckSquare,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'manager', 'employee'] },
  { href: '/dashboard/approvals', icon: CheckSquare, label: 'Approvals', roles: ['admin', 'manager'] },
  { href: '/dashboard/my-expenses', icon: Briefcase, label: 'My Expenses', roles: ['admin', 'manager', 'employee'] },
  { href: '/dashboard/expenses', icon: FileText, label: 'All Expenses', roles: ['admin', 'manager'] },
  { href: '/dashboard/team', icon: Users, label: 'Team', roles: ['admin', 'manager'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser } = useAppContext();

  const userRole = currentUser?.role ?? 'employee';

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <ScanLine className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">ExpensEasy</span>
          </Link>

          {navItems.map((item) => (
            item.roles.includes(userRole) && (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
            )
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname.startsWith('/dashboard/settings') && "bg-accent text-accent-foreground"
                  )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
