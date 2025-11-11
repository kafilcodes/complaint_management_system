"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { User } from "@/lib/types";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Search,
  Filter,
  Shield,
  Wrench,
  Store,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { useUsers } from "@/hooks/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { useStore } from "@/lib/store";
import { apiPut } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Helper to get role icon
const getRoleIcon = (role: string) => {
  switch (role) {
    case "full_developer_admin":
      return <ShieldCheck className="h-4 w-4" />;
    case "it_admin":
      return <Shield className="h-4 w-4" />;
    case "it_technician":
      return <Wrench className="h-4 w-4" />;
    case "store_manager":
      return <Store className="h-4 w-4" />;
    default:
      return <UserIcon className="h-4 w-4" />;
  }
};

// Helper to get role description
const getRoleDescription = (role: string): string => {
  switch (role) {
    case "full_developer_admin":
      return "Full system access with developer privileges";
    case "it_admin":
      return "IT department administrator";
    case "it_technician":
      return "Technical support specialist";
    case "store_manager":
      return "Store location manager";
    case "store_employee":
      return "Store staff member";
    default:
      return "Standard user";
  }
};

// Helper to get department icon
const getDepartmentIcon = (department: string | undefined) => {
  if (!department) return <Building2 className="h-4 w-4" />;
  
  const dept = department.toLowerCase();
  if (dept.includes("customer") || dept.includes("service")) {
    return <Users className="h-4 w-4" />;
  }
  if (dept.includes("it") || dept.includes("tech")) {
    return <Wrench className="h-4 w-4" />;
  }
  if (dept.includes("admin")) {
    return <Shield className="h-4 w-4" />;
  }
  return <Building2 className="h-4 w-4" />;
};

// Helper to get user initials for avatar
const getUserInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const currentUser = useStore((state) => state.user);

  // Debounce search term
  const debouncedSearch = useDebounce(search, 500);

  // Fetch users via API
  const { data: allUsers = [], isLoading } = useUsers({
    role: roleFilter === "all" ? undefined : (roleFilter as "admin" | "full_developer_admin" | "it_technician" | "customer"),
  });

  // Toggle user status mutation
  const toggleStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!toggleUserId) throw new Error("No user selected");
      return await apiPut<{ success: boolean; data: User }>(`/api/users/${toggleUserId}`, { isActive });
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

  const handleToggleStatus = (userId: string, currentDisabled: boolean) => {
    setToggleUserId(userId);
    setToggleIsActive(currentDisabled); // If currently disabled, we want to activate (isActive = true)
  };

  const confirmToggleStatus = () => {
    if (toggleUserId) {
      toggleStatus.mutate(toggleIsActive);
      setToggleUserId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Defensive check - ensure allUsers is not null/undefined before filtering
  if (!allUsers) {
    return (
      <EmptyState
        imageUrl="/no_users.svg"
        title="Unable to Load Users"
        description="There was an error loading the user list. Please refresh the page."
      />
    );
  }

  // Filter out the current admin user from the list
  const users = allUsers
    .filter((user) => user.id !== currentUser?.id)
    .filter((user) => {
      if (!debouncedSearch) return true;
      const searchLower = debouncedSearch.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    });

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
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  User
                </div>
              </SelectItem>
              <SelectItem value="it_technician">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Technician
                </div>
              </SelectItem>
              <SelectItem value="it_admin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  IT Admin
                </div>
              </SelectItem>
              <SelectItem value="full_developer_admin">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Full Admin
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
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
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-help w-fit">
                              {getDepartmentIcon(user.department)}
                              <span className="text-sm font-medium">
                                {user.department || "No Department"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-semibold">{user.department || "No Department Assigned"}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Role: {roleLabels[user.role]}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getRoleDescription(user.role)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {user.disabled ? (
                        <Badge variant="destructive">Inactive</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      )}
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
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(user.id, user.disabled || false)
                            }
                          >
                            {user.disabled ? (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </>
                            ) : (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
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
