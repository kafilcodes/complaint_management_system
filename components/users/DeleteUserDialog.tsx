"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeleteUser, useUsers, useUser } from "@/hooks/use-users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DeleteUserDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({
  userId,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const { data: userToDelete } = useUser(userId);
  const deleteUser = useDeleteUser();
  const [reassignTo, setReassignTo] = useState<string>("");

  // Fetch technicians for reassignment (only if user is a technician)
  const { data: technicians } = useUsers({
    role: "it_technician",
  });

  // Reset reassignment when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setReassignTo("");
    }
  }, [open]);

  const handleDelete = () => {
    if (userId) {
      deleteUser.mutate(
        {
          userId,
          reassignTo: reassignTo || undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  const isTechnician =
    userToDelete?.role === "it_technician" || userToDelete?.role === "it_admin";

  const availableTechnicians = technicians?.filter((t) => t.id !== userId) || [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold">{userToDelete?.name}</span> (
                {userToDelete?.email})?
              </p>

              <div className="rounded-md bg-destructive/10 p-3 text-sm">
                <p className="font-semibold text-destructive">
                  This action cannot be undone.
                </p>
                <p className="mt-1 text-muted-foreground">
                  The user will be permanently deleted from both Firebase
                  Authentication and Firestore.
                </p>
              </div>

              {isTechnician && availableTechnicians.length > 0 && (
                <div className="space-y-2 rounded-md border p-3">
                  <Label htmlFor="reassign">
                    Reassign tickets (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    This user has assigned tickets. You can reassign them to
                    another technician or leave them unassigned.
                  </p>
                  <Select value={reassignTo} onValueChange={setReassignTo}>
                    <SelectTrigger id="reassign">
                      <SelectValue placeholder="Leave unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Leave unassigned</SelectItem>
                      {availableTechnicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name} ({tech.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteUser.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
