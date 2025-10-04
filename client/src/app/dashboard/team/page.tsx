'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, MoreHorizontal, PlusCircle, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { User, UserRole } from '@/lib/definitions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { getTeamMembers } from '@/lib/company';

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('');
}

function InviteUserDialog() {
  const { inviteUser, users } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [password, setPassword] = useState('');
  const [managerSelection, setManagerSelection] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const managerOptions = useMemo(
    () => users.filter(u => ['manager', 'admin'].includes(u.role)),
    [users],
  );

  useEffect(() => {
    if (role !== 'employee') {
      setManagerSelection('none');
    }
  }, [role]);

  const resetForm = () => {
    setEmail('');
    setName('');
    setRole('employee');
    setPassword('');
    setManagerSelection('none');
  };

  const handleInvite = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) {
      toast({
        title: 'Missing information',
        description: 'Name, email, and a temporary password are required.',
        variant: 'destructive',
      });
      return;
    }

    const managerId = role === 'employee' && managerSelection !== 'none' ? managerSelection : null;

    try {
      setIsSubmitting(true);
      const created = await inviteUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        password,
        managerId,
      });
      toast({
        title: 'Team member added',
        description: `${created.name} joined as ${created.role}.`,
      });
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Unable to invite member',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1 bg-accent hover:bg-accent/90">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Invite Member
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            Enter the details and assign a role to invite a new member to your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={(value: UserRole) => setRole(value)} value={role}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Temp password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="col-span-3"
            />
          </div>
          {role === 'employee' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">
                Manager
              </Label>
              <Select
                value={managerSelection}
                onValueChange={value => setManagerSelection(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager yet</SelectItem>
                  {managerOptions.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleInvite}
            type="submit"
            className="bg-accent hover:bg-accent/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditUserRoleDialog({ user, onOpenChange, open }: { user: User; onOpenChange: (open: boolean) => void; open: boolean }) {
  const { updateUser, users } = useAppContext();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [managerSelection, setManagerSelection] = useState<string>(user.managerId ?? 'none');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedRole(user.role);
    setManagerSelection(user.managerId ?? 'none');
  }, [user]);

  const managerOptions = useMemo(
    () =>
      users.filter(
        candidate => ['manager', 'admin'].includes(candidate.role) && candidate.id !== user.id,
      ),
    [users, user.id],
  );

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const managerId = selectedRole === 'employee' && managerSelection !== 'none' ? managerSelection : null;
      const updated = await updateUser(user.id, {
        role: selectedRole,
        managerId,
      });
      toast({
        title: 'Team member updated',
        description: `${updated.name} is now ${updated.role}.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Unable to update member',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Role for {user.name}</DialogTitle>
          <DialogDescription>
            Select a new role for this user. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              User
            </Label>
            <Input id="username" value={user.name} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={(value: UserRole) => setSelectedRole(value)} value={selectedRole}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedRole === 'employee' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">
                Manager
              </Label>
              <Select
                value={managerSelection}
                onValueChange={value => setManagerSelection(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {managerOptions.map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            className='bg-accent hover:bg-accent/90'
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function TeamPage() {
  const { users, currentUser } = useAppContext();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sendingPasswordFor, setSendingPasswordFor] = useState<string | null>(null);
  const { toast } = useToast();
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const teamMembers = useMemo(() => getTeamMembers(users, currentUser?.id), [users, currentUser?.id]);

  const canManage = (targetUser: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.id === targetUser.id) return false; // Cannot manage self

    switch (currentUser.role) {
      case 'admin':
        return true; // Admins can manage anyone
      case 'manager':
        return targetUser.role === 'employee'; // Managers can only manage employees
      case 'employee':
        return false; // Employees can't manage anyone
      default:
        return false;
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
  };

  const handleSendPassword = async (user: User) => {
    setSendingPasswordFor(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/send-password`, { method: 'POST' });
      if (!res.ok && res.status !== 202) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to send password');
      }
      const body = res.status === 202 ? await res.json().catch(() => ({})) : await res.json().catch(() => ({}));
      toast({
        title: 'Temporary password generated',
        description: body?.warning
          ? 'Password reset locally. Configure SMTP to deliver emails.'
          : `A new password was emailed to ${user.email}.`,
      });
    } catch (error: any) {
      console.error('Failed to send password', error);
      toast({
        title: 'Unable to send password',
        description: error?.message ?? 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSendingPasswordFor(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-headline font-semibold">Team</h1>
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
          <div className="ml-auto">
            <InviteUserDialog />
          </div>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Manager</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} alt="Avatar" data-ai-hint="person avatar" />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.managerId ? userMap.get(user.managerId)?.name ?? '—' : '—'}
                  </TableCell>
                  <TableCell>
                    {canManage(user) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(user)}>
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendPassword(user)}
                            disabled={sendingPasswordFor === user.id}
                          >
                            {sendingPasswordFor === user.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Send password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Remove User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      // Render a disabled-like state or nothing if no actions are available
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        disabled
                        className='opacity-50'
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">No actions</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {teamMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No team members yet. Invite your first colleague to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingUser && (
        <EditUserRoleDialog 
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </>
  );
}
