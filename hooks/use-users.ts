import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  phone?: string;
  role: "employee" | "admin" | "full_developer_admin";
  department?: string;
  storeId?: string;
  storeName?: string;
  brand?: string;
  category?: string;
  isActive?: boolean;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  count: number;
}

interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

interface UpdateUserData {
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  disabled?: boolean;
}

/**
 * Hook to fetch all users with optional filters
 */
export function useUsers(filters?: {
  role?: string;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      return data.data;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      if (!userId) return null;

      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user");
      }

      const data: UserResponse = await response.json();
      return data.data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      const result: UserResponse = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully", {
        description: `${data.name} (${data.email}) has been created`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to create user", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserData) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      const result: UserResponse = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
      toast.success("User updated successfully", {
        description: `${data.name}'s profile has been updated`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update user", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reassignTo,
    }: {
      userId: string;
      reassignTo?: string;
    }) => {
      const params = new URLSearchParams();
      if (reassignTo) params.append("reassign", reassignTo);

      const response = await fetch(
        `/api/users/${userId}?${params.toString()}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully", {
        description: "The user has been permanently deleted from both Auth and Firestore",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete user", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to toggle user disabled status
 */
export function useToggleUserStatus(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disabled: boolean) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user status");
      }

      const result: UserResponse = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
      toast.success(
        (data as any).disabled ? "User disabled" : "User enabled",
        {
          description: `${data.name} has been ${(data as any).disabled ? "disabled" : "enabled"}`,
        }
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update user status", {
        description: error.message,
      });
    },
  });
}
