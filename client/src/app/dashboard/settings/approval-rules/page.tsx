"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ApprovalPolicyDTO, ApprovalPolicyApproverDTO } from "@/lib/definitions";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

// Virtual approver ID for "Manager"
const MANAGER_VIRTUAL_ID = "__MANAGER__";

interface PolicyWithDetails extends ApprovalPolicyDTO {
  userName?: string;
  approverNames?: string[];
}

export default function ApprovalRulesPage() {
  const { users, currentCompany, currentUser } = useAppContext();
  const [policies, setPolicies] = useState<PolicyWithDetails[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<PolicyWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [isManagerApprover, setIsManagerApprover] = useState(false);
  const [managerFirst, setManagerFirst] = useState(false);
  const [sequential, setSequential] = useState(false);
  const [minApprovalPercentage, setMinApprovalPercentage] = useState<number | undefined>(undefined);
  const [approvers, setApprovers] = useState<Array<{ approverId: string; required: boolean; order: number }>>([]);

  const companyUsers = useMemo(() => users.filter(u => u.companyId === currentCompany?.id), [users, currentCompany]);
  const isAdmin = currentUser?.role === 'admin';

  // Restrict access to admins only
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Only administrators can configure approval rules.</p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (currentCompany) {
      loadPolicies();
    }
  }, [currentCompany]);

  async function loadPolicies() {
    if (!currentCompany) return;
    try {
      const res = await fetch(`/api/approval-policies?companyId=${currentCompany.id}`);
      if (!res.ok) throw new Error(await res.text());
      const data: ApprovalPolicyDTO[] = await res.json();
      
      // Enrich with user names
      const enriched: PolicyWithDetails[] = data.map(p => {
        const userName = p.userId ? users.find(u => u.id === p.userId)?.name : undefined;
        const approverNames = p.approvers.map(a => {
          if (a.approverId === MANAGER_VIRTUAL_ID) return "Manager (Auto)";
          return users.find(u => u.id === a.approverId)?.name || "Unknown";
        });
        return { ...p, userName, approverNames };
      });
      setPolicies(enriched);
    } catch (e) {
      console.error('Failed to load policies', e);
    }
  }

  function resetForm() {
    setEditingPolicy(null);
    setSelectedUserId(undefined);
    setCategory(undefined);
    setDescription("");
    setIsManagerApprover(false);
    setManagerFirst(false);
    setSequential(false);
    setMinApprovalPercentage(undefined);
    setApprovers([]);
  }

  function editPolicy(policy: PolicyWithDetails) {
    setEditingPolicy(policy);
    setSelectedUserId(policy.userId ?? undefined);
    setCategory(policy.category ?? undefined);
    setDescription(policy.description ?? "");
    setIsManagerApprover(policy.isManagerApprover);
    setManagerFirst(policy.managerFirst);
    setSequential(policy.sequential);
    setMinApprovalPercentage(policy.minApprovalPercentage ?? undefined);
    setApprovers(policy.approvers.map(a => ({ ...a })));
  }

  function addApprover() {
    setApprovers(prev => [...prev, { approverId: "", required: false, order: prev.length }]);
  }

  function updateApprover(idx: number, patch: Partial<{ approverId: string; required: boolean; order: number }>) {
    setApprovers(prev => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  function removeApprover(idx: number) {
    setApprovers(prev => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order: i })));
  }

  async function savePolicy() {
    if (!currentCompany) return;
    const payload: ApprovalPolicyDTO = {
      ...(editingPolicy?.id ? { id: editingPolicy.id } : {}),
      companyId: currentCompany.id,
      userId: selectedUserId === "__none__" ? null : selectedUserId ?? null,
      category: category ?? null,
      description,
      isManagerApprover,
      managerFirst,
      sequential,
      minApprovalPercentage: minApprovalPercentage ?? null,
      approvers: approvers.filter(a => a.approverId),
    };

    try {
      const method = editingPolicy ? "PUT" : "POST";
      const res = await fetch("/api/approval-policies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.text();
        alert(`Failed: ${err}`);
        return;
      }
      alert(editingPolicy ? "Policy updated" : "Policy created");
      resetForm();
      loadPolicies();
    } catch (e) {
      console.error(e);
      alert("Error saving policy");
    }
  }

  async function deletePolicy(id: string) {
    try {
      const res = await fetch(`/api/approval-policies?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      alert("Policy deleted");
      loadPolicies();
    } catch (e) {
      console.error(e);
      alert("Failed to delete policy");
    } finally {
      setDeleteConfirm(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-semibold">Approval Rules</h1>
        <p className="text-muted-foreground">Only administrators can manage approval policies.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headline font-semibold">Approval Rules</h1>
        <p className="text-muted-foreground">Configure company or user-specific approval workflows with automatic manager routing.</p>
      </div>

      {/* Existing Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policies defined yet. Create one below.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Settings</TableHead>
                  <TableHead>Approvers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.userName ? (
                        <Badge variant="secondary">{p.userName}</Badge>
                      ) : (
                        <Badge>Company-wide</Badge>
                      )}
                    </TableCell>
                    <TableCell>{p.category || <span className="text-muted-foreground italic">All</span>}</TableCell>
                    <TableCell className="max-w-xs truncate">{p.description || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {p.isManagerApprover && <Badge variant="outline">Manager</Badge>}
                        {p.managerFirst && <Badge variant="outline">Manager First</Badge>}
                        {p.sequential && <Badge variant="outline">Sequential</Badge>}
                        {p.minApprovalPercentage && <Badge variant="outline">{p.minApprovalPercentage}% min</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 text-xs max-w-xs">
                        {p.approverNames?.map((name, idx) => (
                          <Badge key={idx} variant={p.approvers[idx]?.required ? "default" : "secondary"}>
                            {name}
                            {p.approvers[idx]?.required && <Check className="ml-1 h-3 w-3" />}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => editPolicy(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(p.id!)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Policy Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingPolicy ? "Edit Policy" : "Create New Policy"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>User (optional: leave empty for company-wide)</Label>
              <Select value={selectedUserId || "__none__"} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select user or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (Company-wide)</SelectItem>
                  {companyUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category (optional: leave empty for all categories)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. miscellaneous, travel"
                value={category ?? ""}
                onChange={e => setCategory(e.target.value || undefined)}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              className="mt-1"
              placeholder="Brief explanation of this policy"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={isManagerApprover} onCheckedChange={v => setIsManagerApprover(!!v)} id="mgr" />
                <Label htmlFor="mgr" className="cursor-pointer">
                  Include employee&apos;s manager as approver
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={managerFirst}
                  onCheckedChange={v => setManagerFirst(!!v)}
                  id="mgrfirst"
                  disabled={!isManagerApprover}
                />
                <Label htmlFor="mgrfirst" className={`cursor-pointer ${!isManagerApprover ? 'text-muted-foreground' : ''}`}>
                  Manager must approve first
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={sequential} onCheckedChange={v => setSequential(!!v)} id="seq" />
                <Label htmlFor="seq" className="cursor-pointer">
                  Approvers must approve in sequence
                </Label>
              </div>
              <div>
                <Label>Minimum Approval Percentage (%)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={minApprovalPercentage ?? ""}
                  onChange={e => setMinApprovalPercentage(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional Approvers</Label>
                <Button variant="secondary" size="sm" onClick={addApprover}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {approvers.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 p-2 border rounded">
                    <Select value={a.approverId} onValueChange={(v) => updateApprover(idx, { approverId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MANAGER_VIRTUAL_ID}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Manager (Auto)</Badge>
                          </div>
                        </SelectItem>
                        {companyUsers
                          .filter(u => u.id !== selectedUserId) // exclude policy target user
                          .map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} - {u.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={a.required}
                        onCheckedChange={v => updateApprover(idx, { required: !!v })}
                        id={`req-${idx}`}
                      />
                      <Label htmlFor={`req-${idx}`} className="text-xs cursor-pointer whitespace-nowrap">
                        Required
                      </Label>
                    </div>
                    <Input
                      type="number"
                      value={a.order}
                      onChange={e => updateApprover(idx, { order: Number(e.target.value) })}
                      className="w-16"
                      title="Order"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeApprover(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {isManagerApprover && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 The employee&apos;s manager will be included automatically. You can also add &quot;Manager (Auto)&quot; as an explicit approver above.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {editingPolicy && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button onClick={savePolicy}>
              {editingPolicy ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The policy will be permanently deleted. Existing expenses will retain their approval rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deletePolicy(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
