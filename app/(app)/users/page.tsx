/**
 * USERS PAGE
 * 
 * User management page (full_developer_admin only).
 * Full CRUD operations for user accounts with Firebase Admin.
 * 
 * @module app/(app)/users/page
 */

"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserList } from "@/components/users/UserList";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";

export default function UsersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const handleEdit = (userId: string) => {
    setEditUserId(userId);
  };

  const handleDelete = (userId: string) => {
    setDeleteUserId(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <UserList onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditUserDialog
        userId={editUserId}
        open={editUserId !== null}
        onOpenChange={(open) => !open && setEditUserId(null)}
      />
      <DeleteUserDialog
        userId={deleteUserId}
        open={deleteUserId !== null}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      />
    </div>
  );
}
