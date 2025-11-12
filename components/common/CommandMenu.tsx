"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  FileText,
  Users,
  LayoutDashboard,
  UserCircle,
  Bell,
  Settings,
  LogOut,
  Home,
  Wrench,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/store";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { toast } from "sonner";

/**
 * Global Command Menu (Cmd+K / Ctrl+K)
 * Provides quick navigation and actions across the app
 * 
 * @module components/common/CommandMenu
 */

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Toggle command menu with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear Firebase auth session
      await firebaseSignOut(auth);
      
      // Clear Zustand store (auth state) - import store directly
      const { useStore } = await import("@/lib/store");
      useStore.getState().clearAuth();
      
      // Clear React Query cache
      const { QueryClient } = await import("@tanstack/react-query");
      const queryClient = new QueryClient();
      queryClient.clear();
      
      // Clear local storage
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/tickets"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Tickets</span>
          </CommandItem>
          {(user?.role === "admin" || user?.role === "full_developer_admin") && (
            <CommandItem onSelect={() => runCommand(() => router.push("/users"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Users</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/notifications"))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {(user?.role === "admin" || user?.role === "full_developer_admin") && (
            <CommandItem onSelect={() => runCommand(() => router.push("/create-ticket"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Ticket</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(handleLogout)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Helper component to display keyboard shortcut hint
 * Can be used in headers or UI to show users the Cmd+K shortcut
 */
export function CommandMenuTrigger() {
  const [mounted, setMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <span>Press</span>
      <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>K</Kbd>
      <span>to search</span>
    </div>
  );
}
