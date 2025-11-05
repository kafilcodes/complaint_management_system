# 🚀 Next Steps & Remaining Tasks

**Last Updated:** November 5, 2025  
**Current Status:** Task 02 Complete ✅  
**Current Branch:** `main`  
**Latest Commit:** `03961ad`

---

## ✅ Recently Completed

### Task 02: Admin Layout & Navigation (COMPLETE)
- ✅ Responsive sidebar and floating dock navigation
- ✅ Role-based navigation filtering
- ✅ Auth integration with Zustand store
- ✅ Logout functionality
- ✅ Mobile-first responsive design
- ✅ All skeleton pages verified

**Latest Fix:**
- ✅ Connected AppSidebar to real auth state via `useAuth()` hook
- ✅ Fixed type mismatches between navConfig roles and User type
- ✅ Removed placeholder user data

---

## 📋 Immediate Next Tasks (Priority Order)

### 1. 🔔 Header Enhancements (High Priority)
**Estimated Time:** 2-3 hours

**Tasks:**
- [ ] Create `AppHeader` component
- [ ] Add notification bell icon with badge
- [ ] Integrate with `useNotificationCount()` from store
- [ ] Add theme toggle button (light/dark/system)
- [ ] Add breadcrumb navigation
- [ ] Make header sticky with proper z-index

**Files to Create:**
```
components/
├── layout/
│   └── AppHeader.tsx (new)
└── ui/
    └── breadcrumb.tsx (shadcn component)
```

**Implementation Notes:**
- Bell icon should show red badge if `unreadNotificationsCount > 0`
- Theme toggle should use `next-themes` hook
- Breadcrumbs should auto-generate from current pathname
- Header should have backdrop blur for modern look

---

### 2. 📊 Dashboard Data Integration (High Priority)
**Estimated Time:** 3-4 hours

**Tasks:**
- [ ] Create TanStack Query hooks for dashboard stats
- [ ] Connect StatCard components to real data
- [ ] Add loading skeletons during data fetch
- [ ] Implement 7-day trend calculations
- [ ] Add error handling with fallback UI
- [ ] Test with different user roles

**Files to Modify:**
```
app/(app)/dashboard/page.tsx (update)
hooks/useQueries.ts (add dashboard queries)
app/api/dashboard/stats/route.ts (verify exists)
```

**API Endpoints to Use:**
- `GET /api/dashboard/stats` - Already exists
- Returns: `AdminDashboardStats | TechnicianDashboardStats`

**Implementation Pattern:**
```typescript
// Example hook
export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'stats', user?.uid],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30s
    staleTime: 10000, // Consider stale after 10s
  });
}
```

---

### 3. 🎫 Tickets Page Real-time Updates (High Priority)
**Estimated Time:** 4-5 hours

**Tasks:**
- [ ] Create TanStack Query hook with real-time sync
- [ ] Implement Firebase `onSnapshot` for live updates
- [ ] Add filters (status, brand, assignedTo)
- [ ] Add search functionality
- [ ] Add pagination (infinite scroll or page-based)
- [ ] Add sorting options
- [ ] Test performance with 100+ tickets

**Files to Modify:**
```
app/(app)/tickets/page.tsx (update)
hooks/useQueries.ts (add tickets queries)
components/tickets/TicketList.tsx (update)
components/tickets/TicketFilters.tsx (verify/create)
```

**Real-time Implementation Pattern:**
```typescript
export function useTickets(filters: TicketFilters) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Set up Firestore onSnapshot listener
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', filters.status || 'open'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update query cache with real-time data
      queryClient.setQueryData(['tickets', filters], tickets);
    });
    
    return () => unsubscribe();
  }, [filters]);
  
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => fetchTickets(filters),
    staleTime: Infinity, // Real-time updates via onSnapshot
  });
}
```

---

### 4. 🔐 User Management (Admin Only) (Medium Priority)
**Estimated Time:** 3-4 hours

**Tasks:**
- [ ] Verify `/users` page only accessible to `full_developer_admin`
- [ ] Add route protection middleware check
- [ ] Test user CRUD operations
- [ ] Add confirmation dialogs for delete
- [ ] Implement user search and filters
- [ ] Add role badge components
- [ ] Test with different admin roles

**Files to Verify:**
```
app/(app)/users/page.tsx (exists)
app/api/users/* (verify all endpoints)
middleware.ts (add role check)
```

**Route Protection:**
```typescript
// In middleware.ts
if (pathname.startsWith('/users')) {
  const role = decodedToken.role;
  if (role !== 'full_developer_admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

---

### 5. 🖼️ File Upload System (Medium Priority)
**Estimated Time:** 2-3 hours

**Tasks:**
- [ ] Verify Firebase Storage rules (5MB limit, images/PDFs only)
- [ ] Test file upload in Create Ticket form
- [ ] Test resolution form image uploads
- [ ] Add image preview before upload
- [ ] Add progress indicators
- [ ] Add error handling for failed uploads
- [ ] Implement image optimization (compress before upload)

**Files to Test:**
```
lib/storage.ts (verify helper functions)
components/tickets/CreateTicketForm.tsx
components/tickets/ResolutionForm.tsx
firebase/storage.rules (to be created)
```

**Storage Rules Example:**
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tickets/{ticketId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

---

### 6. 🔔 Real-time Notifications System (Medium Priority)
**Estimated Time:** 3-4 hours

**Tasks:**
- [ ] Verify notification API endpoints working
- [ ] Test real-time notification creation on ticket events
- [ ] Implement bell icon with badge in header
- [ ] Add notification dropdown menu
- [ ] Add "mark as read" functionality
- [ ] Add "mark all as read" button
- [ ] Test with multiple users

**Implementation:**
```typescript
// useNotifications hook
export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setCount } = useNotificationCount();
  
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCount(notifications.length);
      queryClient.setQueryData(['notifications', user.uid], notifications);
    });
    
    return () => unsubscribe();
  }, [user]);
}
```

---

### 7. 🎨 Theme System Implementation (Low Priority)
**Estimated Time:** 2 hours

**Tasks:**
- [ ] Add theme toggle in header
- [ ] Test light/dark/system modes
- [ ] Verify all components respect theme
- [ ] Add smooth transitions between themes
- [ ] Test color contrast for accessibility
- [ ] Add theme persistence (already in Zustand)

**Files to Update:**
```
components/layout/AppHeader.tsx (add toggle)
components/ui/theme-toggle.tsx (create)
```

**Theme Toggle Component:**
```typescript
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Test login with all 4 role types
- [ ] Test navigation visibility for each role
- [ ] Test logout functionality
- [ ] Test responsive layout (360px - 1920px)
- [ ] Test mobile floating dock
- [ ] Test desktop sidebar collapse/expand
- [ ] Test keyboard shortcut (Cmd/Ctrl+B)
- [ ] Test all CRUD operations
- [ ] Test file uploads
- [ ] Test notifications
- [ ] Test theme switching

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Performance Testing
- [ ] Run Lighthouse audit (target 90+ all categories)
- [ ] Test with 100+ tickets
- [ ] Test with slow network (throttling)
- [ ] Test with 1000+ notifications
- [ ] Check bundle size
- [ ] Verify no memory leaks

---

## 📦 Deployment Preparation

### Firebase Configuration
- [ ] Create `firestore.rules` file
- [ ] Create `storage.rules` file
- [ ] Create `firestore.indexes.json`
- [ ] Deploy security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy storage rules: `firebase deploy --only storage:rules`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

### Environment Variables
Ensure these are set in production:
```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side - Keep Secret!)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# App Configuration
NEXT_PUBLIC_APP_NAME="ServiceFirst"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Vercel Deployment
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Run build locally: `npm run build`
- [ ] Fix any build errors
- [ ] Deploy to preview: `vercel`
- [ ] Test preview deployment thoroughly
- [ ] Deploy to production: `vercel --prod`
- [ ] Add environment variables in Vercel dashboard
- [ ] Set up custom domain (if applicable)

---

## 🐛 Known Issues & Technical Debt

### Current Issues
None! 🎉

### Technical Debt
1. **Avatar Support**: User type doesn't have `avatar` field
   - **Solution**: Add optional `avatarUrl?: string` to User type in `lib/types.ts`
   - **Impact**: Low - Initials work fine for now

2. **Sidebar State Conflict**: Two `useSidebar` exports
   - shadcn sidebar has `useSidebar` hook
   - Zustand store has `useSidebar` hook
   - **Solution**: Rename Zustand hook to `useSidebarStore` or remove it (use shadcn's instead)
   - **Impact**: Low - shadcn's hook is being used

3. **Role Type Inconsistency**: NavConfig and User types have different role sets
   - NavConfig: `"admin" | "full_developer_admin" | "employee" | "user"`
   - User: `"full_developer_admin" | "it_admin" | "it_technician" | "store_manager" | "store_employee"`
   - **Solution**: Update navConfig to use `UserRole` type from `lib/types.ts`
   - **Impact**: Fixed in latest commit ✅

---

## 📚 Documentation to Create

### For Team
- [ ] API Documentation (OpenAPI/Swagger)
- [ ] Component Storybook
- [ ] Database Schema Diagram
- [ ] User Flow Diagrams
- [ ] Deployment Guide
- [ ] Troubleshooting Guide

### For Users
- [ ] User Manual (Admin)
- [ ] User Manual (Technician)
- [ ] FAQ
- [ ] Video Tutorials
- [ ] Onboarding Guide

---

## 🎯 Sprint Planning

### Week 1 (Current)
- ✅ Day 1: Project Setup & Login
- ✅ Day 2: Admin Layout & Navigation
- 🔄 Day 3: Dashboard & Real-time Data
- ⏳ Day 4: Tickets Management & CRUD
- ⏳ Day 5: Testing & Deployment

### Week 2 (Future)
- Advanced Features
- Performance Optimization
- User Feedback Integration
- Polish & Bug Fixes
- Production Launch

---

## 💡 Future Enhancements

### Phase 2 (After v1.0 Launch)
- [ ] WhatsApp Integration (share ticket details)
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Export reports (PDF, Excel)
- [ ] Advanced analytics dashboard
- [ ] Ticket categories and tags
- [ ] Custom fields per brand
- [ ] Bulk operations
- [ ] Audit log
- [ ] Multi-language support

### Phase 3 (Advanced)
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)
- [ ] Voice notes for issues
- [ ] QR code scanning for products
- [ ] Geolocation tracking
- [ ] Customer portal
- [ ] Integration with inventory system
- [ ] AI-powered issue categorization
- [ ] Predictive maintenance

---

## 🔗 Quick Links

### Project Resources
- **GitHub Repo**: https://github.com/kafilcodes/complaint_management_system
- **Local Dev**: http://localhost:3000
- **Firebase Console**: [Your Firebase Project URL]
- **Vercel Dashboard**: [Your Vercel Project URL]

### Documentation
- **PRD**: `context/Project Requirements Document (PRD).md`
- **Design System**: `context/Design System & Principles.md`
- **Firebase Setup**: `context/Firebase Setup & Services.md`
- **Database Modeling**: `context/Firestore Database Modeling.md`
- **API Definitions**: `context/API Definitions.md`

### Key Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # Check TypeScript
npm run lint             # Run ESLint

# Git
git status               # Check status
git log --oneline -10    # View recent commits
git checkout -b feat/... # Create feature branch

# Firebase
firebase deploy          # Deploy all
firebase emulators:start # Start emulators

# Vercel
vercel                   # Deploy preview
vercel --prod            # Deploy production
```

---

## 📞 Support & Questions

If you have questions or need help:
1. Check the project documentation in `/context`
2. Review session notes in `/docs`
3. Check this NEXT_STEPS.md file
4. Review the README.md
5. Ask your development team

---

**Remember:**
- Commit frequently with descriptive messages
- Test before pushing
- Follow the established patterns
- Keep documentation updated
- Write production-quality code

**Current Priority:**
🎯 Focus on **Dashboard Data Integration** and **Header Enhancements** next!

---

**Last Commit:** `03961ad` - fix: integrate real auth state with AppSidebar component  
**Next Milestone:** Real-time data integration  
**Target Completion:** End of Week 1
