"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { User } from "@/lib/types";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Filter,
  Shield,
  Wrench,
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
import { useStore as useAppStore } from "@/lib/store";
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
  admin: "Admin",
  employee: "Employee",
};

const roleColors: Record<string, string> = {
  full_developer_admin: "red",
  admin: "purple",
  employee: "blue",
};

// Helper to get role icon
const getRoleIcon = (role: string) => {
  switch (role) {
    case "full_developer_admin":
      return <ShieldCheck className="h-4 w-4" />;
    case "admin":
      return <Shield className="h-4 w-4" />;
    case "employee":
      return <UserIcon className="h-4 w-4" />;
    default:
      return <UserIcon className="h-4 w-4" />;
  }
};

// Helper to get role description
const getRoleDescription = (role: string): string => {
  switch (role) {
    case "full_developer_admin":
      return "Full system access with developer privileges";
    case "admin":
      return "Administrator with ticket management access";
    case "employee":
      return "Employee (differentiated by department)";
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
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get current user for role checking
  const currentUser = useAppStore((state) => state.user);

  // Debounce search term
  const debouncedSearch = useDebounce(search, 500);

  // Fetch all users via API
  const { data: allUsers = [], isLoading } = useUsers();

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

  // Filter out the current admin user from the list and apply department filter
  const users = allUsers
    .filter((user) => user.id !== currentUser?.id)
    .filter((user) => {
      // Department filter
      if (departmentFilter !== "all") {
        const userDept = (user.department || "").toLowerCase();
        return userDept === departmentFilter.toLowerCase();
      }
      return true;
    })
    .filter((user) => {
      // Search filter
      if (!debouncedSearch) return true;
      const searchLower = debouncedSearch.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.department || "").toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    });

  // Get unique departments for filter
  const departments = Array.from(
    new Set(
      allUsers
        .map((u) => u.department)
        .filter((dept): dept is string => dept !== undefined && dept !== null && dept !== "")
    )
  ).sort();

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
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  <div className="flex items-center gap-2">
                    {getDepartmentIcon(dept)}
                    {dept}
                  </div>
                </SelectItem>
              ))}
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
                        search || departmentFilter !== "all"
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
    </>
  );
}
