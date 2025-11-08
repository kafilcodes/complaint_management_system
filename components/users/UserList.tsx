"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import { useRealtimeUsers } from "@/hooks/useRealtimeUsers";
import { useStore } from "@/lib/store";
import { apiPut } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

interface UserListProps {
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const roleLabels: Record<string, string> = {
  full_developer_admin: "Full Admin",
  it_admin: "IT Admin",
  it_technician: "Technician",
  store_manager: "Store Manager",
  store_employee: "Store Employee",
};

const roleColors: Record<string, string> = {
  full_developer_admin: "red",
  it_admin: "purple",
  it_technician: "blue",
  store_manager: "green",
  store_employee: "default",
};

// Helper to convert Timestamp or Date to Date object
const toDate = (value: Date | Timestamp | string | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return null;
};

export function UserList({ onEdit, onDelete }: UserListProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [toggleUserId, setToggleUserId] = useState<string | null>(null);
  const [toggleIsActive, setToggleIsActive] = useState(true);

  const queryClient = useQueryClient();
  const currentUser = useStore((state) => state.user);

  // Fetch users with real-time updates
  const { data: allUsers = [], isLoading } = useRealtimeUsers({
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });

  // Filter out the current admin user from the list
  const users = allUsers.filter((user) => user.id !== currentUser?.id);

  // Toggle user status mutation
  const toggleStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!toggleUserId) throw new Error("No user selected");
      return await apiPut(`/api/users/${toggleUserId}`, { isActive });
    },
    onSuccess: (data) => {
      const user = data.data;
      toast.success(
        user.isActive ? "User activated" : "User deactivated",
        {
          description: `${user.name} has been ${user.isActive ? "activated" : "deactivated"}`,
        }
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setToggleUserId(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to update user status", {
        description: error.message,
      });
    },
  });

  const handleToggleStatus = (userId: string, currentIsActive: boolean) => {
    setToggleUserId(userId);
    setToggleIsActive(!currentIsActive);
  };

  const confirmToggleStatus = () => {
    if (toggleUserId) {
      toggleStatus.mutate(toggleIsActive);
      setToggleUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="it_technician">Technician</SelectItem>
              <SelectItem value="it_admin">IT Admin</SelectItem>
              <SelectItem value="full_developer_admin">Full Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      imageUrl="/no_users.svg"
                      title="No Users Found"
                      description={
                        search || roleFilter !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "Users you create will appear here. Start by adding your first team member."
                      }
                      className="py-8"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          roleColors[user.role] === "default"
                            ? "secondary"
                            : "default"
                        }
                        className={
                          roleColors[user.role] === "blue"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : roleColors[user.role] === "purple"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : roleColors[user.role] === "red"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : ""
                        }
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!user.isActive ? (
                        <Badge variant="destructive">Inactive</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.updatedAt
                        ? (() => {
                            const date = toDate(user.updatedAt);
                            return date ? formatDistanceToNow(date, { addSuffix: true }) : "Never";
                          })()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(() => {
                        const date = toDate(user.createdAt);
                        return date ? formatDistanceToNow(date, { addSuffix: true }) : "Unknown";
                      })()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(user.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(user.id, user.isActive)
                            }
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results count */}
        {users && users.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog
        open={toggleUserId !== null}
        onOpenChange={(open: boolean) => !open && setToggleUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleIsActive ? "Activate User" : "Deactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleIsActive
                ? "This user will be able to sign in again."
                : "This user will not be able to sign in. Their data will remain intact."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              {toggleIsActive ? "Activate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
