/**
 * ZUSTAND GLOBAL STATE STORE
 * 
 * This store manages global, ephemeral UI state that doesn't belong in the database.
 * Per the architectural rules, we use Zustand ONLY for client-side UI state,
 * never for server data (that's TanStack Query's job).
 * 
 * State managed here:
 * - Current authenticated user (for display)
 * - Theme mode (light/dark)
 * - Sidebar open/closed state
 * - Global loading states
 * - Notification count badge
 * 
 * @module lib/store
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, ThemeMode } from "./types";

// ==============================================================================
// STORE INTERFACES
// ==============================================================================

/**
 * Auth state slice
 */
interface AuthSlice {
  user: User | null;
  authToken: string | null; // Firebase ID token for API requests
  isAuthLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void; // New action to set token
  setAuthLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

/**
 * Theme state slice
 */
interface ThemeSlice {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

/**
 * UI state slice
 */
interface UISlice {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Global loading overlay
  globalLoading: boolean;
  globalLoadingMessage?: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Notification badge count
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;
  incrementUnreadNotifications: () => void;
  decrementUnreadNotifications: () => void;
}

/**
 * Combined store interface
 */
interface AppStore extends AuthSlice, ThemeSlice, UISlice {}

// ==============================================================================
// ZUSTAND STORE
// ==============================================================================

/**
 * Main application store
 * 
 * Only the theme preference is persisted to localStorage.
 * Auth state is managed by Firebase Auth and TanStack Query.
 */
export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // ========================================================================
      // AUTH SLICE
      // ========================================================================
      user: null,
      authToken: null, // Firebase ID token
      isAuthLoading: true, // Start as true until Firebase initializes
      
      setUser: (user) => {
        console.log("========================================");
        console.log("[Store] � STORE UPDATE - setUser Called");
        console.log("========================================");
        console.log("[Store] User Object Received:");
        console.log(JSON.stringify(user, null, 2));
        console.log("[Store] � Extracted Fields:");
        console.log("  - id:", user?.id);
        console.log("  - email:", user?.email);
        console.log("  - name:", user?.name);
        console.log("  - role:", user?.role);
        console.log("  - department:", user?.department);
        console.log("  - employeeId:", (user as any)?.employeeId);
        console.log("[Store] ⚠️ CRITICAL - Role being stored:", user?.role);
        console.log("[Store] ⚠️ Role type:", typeof user?.role);
        console.log("========================================");
        set({ user });
        console.log("[Store] ✅ User stored in Zustand state");
        console.log("========================================");
      },
      
      setAuthToken: (token) => {
        console.log("[Store] 🔑 setAuthToken called");
        console.log("[Store] Token:", token ? `${token.substring(0, 20)}... (length: ${token.length})` : "NULL");
        set({ authToken: token });
        console.log("[Store] ✅ Auth token stored in Zustand");
      },
      
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      
      clearAuth: () => set({ user: null, authToken: null, isAuthLoading: false }),

      // ========================================================================
      // THEME SLICE
      // ========================================================================
      theme: "system",
      
      setTheme: (theme) => set({ theme }),

      // ========================================================================
      // UI SLICE
      // ========================================================================
      sidebarOpen: false,
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      globalLoading: false,
      globalLoadingMessage: undefined,
      
      setGlobalLoading: (loading, message) =>
        set({ globalLoading: loading, globalLoadingMessage: message }),
      
      unreadNotificationsCount: 0,
      
      setUnreadNotificationsCount: (count) =>
        set({ unreadNotificationsCount: Math.max(0, count) }),
      
      incrementUnreadNotifications: () =>
        set((state) => ({
          unreadNotificationsCount: state.unreadNotificationsCount + 1,
        })),
      
      decrementUnreadNotifications: () =>
        set((state) => ({
          unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1),
        })),
    }),
    {
      name: "app-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist theme preference
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// ==============================================================================
// CONVENIENCE HOOKS (Optional - for better ergonomics)
// ==============================================================================

/**
 * Hook to access auth state
 */
export const useAuth = () => {
  const user = useStore((state) => state.user);
  const authToken = useStore((state) => state.authToken);
  const isAuthLoading = useStore((state) => state.isAuthLoading);
  const setUser = useStore((state) => state.setUser);
  const setAuthToken = useStore((state) => state.setAuthToken);
  const setAuthLoading = useStore((state) => state.setAuthLoading);
  const clearAuth = useStore((state) => state.clearAuth);

  return { user, authToken, isAuthLoading, setUser, setAuthToken, setAuthLoading, clearAuth };
};

/**
 * Hook to access theme state
 */
export const useTheme = () => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  return { theme, setTheme };
};

/**
 * Hook to access sidebar state
 */
export const useSidebar = () => {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);
  const toggleSidebar = useStore((state) => state.toggleSidebar);

  return { sidebarOpen, setSidebarOpen, toggleSidebar };
};

/**
 * Hook to access global loading state
 */
export const useGlobalLoading = () => {
  const globalLoading = useStore((state) => state.globalLoading);
  const globalLoadingMessage = useStore((state) => state.globalLoadingMessage);
  const setGlobalLoading = useStore((state) => state.setGlobalLoading);

  return { globalLoading, globalLoadingMessage, setGlobalLoading };
};

/**
 * Hook to access notification count
 */
export const useNotificationCount = () => {
  const count = useStore((state) => state.unreadNotificationsCount);
  const setCount = useStore((state) => state.setUnreadNotificationsCount);
  const increment = useStore((state) => state.incrementUnreadNotifications);
  const decrement = useStore((state) => state.decrementUnreadNotifications);

  return { count, setCount, increment, decrement };
};
