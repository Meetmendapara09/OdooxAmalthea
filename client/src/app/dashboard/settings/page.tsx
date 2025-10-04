'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/context/app-context";
import { Separator } from "@/components/ui/separator";
import { hasPermission } from "@/lib/rbac";

export default function SettingsPage() {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading user data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-headline font-semibold">My Account</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {hasPermission(currentUser.role, 'configureApprovalRules') && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Rules</CardTitle>
            <CardDescription>Configure company or user-specific approval workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Create policies defining manager involvement, approver list, sequence, and minimum approval percentage.</p>
          </CardContent>
          <CardFooter>
            <a href="/dashboard/settings/approval-rules">
              <Button className="bg-accent hover:bg-accent/90">Open Approval Rules</Button>
            </a>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is your public display name and email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={currentUser.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={currentUser.email} readOnly />
          </div>
           <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} readOnly />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button className="bg-accent hover:bg-accent/90">Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password. It's a good practice to use a strong, unique password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button className="bg-accent hover:bg-accent/90">Update Password</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications from ExpensEasy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive emails about expense status updates and approvals.</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get push notifications on your mobile device.</p>
                </div>
                <Switch id="push-notifications" />
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
          <Button className="bg-accent hover:bg-accent/90">Save Preferences</Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
            <p className="font-medium">Delete your account</p>
            <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
