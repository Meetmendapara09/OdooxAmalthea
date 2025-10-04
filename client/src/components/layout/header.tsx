'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  ScanLine,
  Search,
  Home,
  FileText,
  Users,
  Briefcase,
  CheckSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getDashboardTitle } from '@/lib/roles';

export function AppHeader() {
  const { currentUser } = useAppContext();
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const userRole = currentUser?.role ?? 'employee';
  const dashboardTitle = getDashboardTitle(currentUser?.role);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'manager', 'employee'] },
    { href: '/dashboard/approvals', icon: CheckSquare, label: 'Approvals', roles: ['admin', 'manager'] },
    { href: '/dashboard/my-expenses', icon: Briefcase, label: 'My Expenses', roles: ['admin', 'manager', 'employee'] },
    { href: '/dashboard/expenses', icon: FileText, label: 'All Expenses', roles: ['admin', 'manager'] },
    { href: '/dashboard/team', icon: Users, label: 'Team', roles: ['admin', 'manager'] },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <ScanLine className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">ExpensEasy</span>
            </Link>
            {navItems.map(item => (
              item.roles.includes(userRole) && (
                <Link key={item.label} href={item.href} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search expenses..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>

      {currentUser && (
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
          {dashboardTitle}
        </span>
      )}

      {currentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
              <Avatar>
                <AvatarImage src={currentUser.avatarUrl} alt="Avatar" data-ai-hint="person avatar" />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/dashboard/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
