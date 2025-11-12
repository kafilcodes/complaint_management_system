# ✅ TODO Checklist

## 🔥 Immediate (Do This First!)

- [ ] **Add Firebase Credentials to `.env.local`**
  - Get Firebase config from Firebase Console
  - Add both client and admin credentials
  - Create a random ADMIN_SEED_SECRET

- [ ] **Start Development Server**
  ```bash
  npm run dev
  ```

- [ ] **Seed Admin Users**
  ```bash
  curl -X POST http://localhost:3000/api/auth/seed-admins \
    -H "Content-Type: application/json" \
    -d '{"secret": "your-secret-from-env"}'
  ```

- [ ] **Test Basic Flow**
  - [ ] Login with admin@MParekh.com
  - [ ] Navigate to Create Ticket
  - [ ] Fill out and submit the form
  - [ ] View ticket in Tickets page
  - [ ] Search and filter tickets

---

## 📱 Session 6: Single Ticket View & Resolution

### Create Ticket Detail Page
- [ ] Create `app/(app)/tickets/[id]/page.tsx`
- [ ] Fetch ticket data with `useTicket(id)` hook
- [ ] Display all ticket information
- [ ] Show customer details
- [ ] Show product information
- [ ] Display issue description
- [ ] Show creation and update timestamps
- [ ] Add breadcrumb navigation
- [ ] Show assigned technician (if any)
- [ ] Display current status with badge

### Build Resolution Form Component
- [ ] Create `components/tickets/ResolutionForm.tsx`
- [ ] Add form fields:
  - [ ] Product Serial Number (text input)
  - [ ] Service Rating (1-5 stars)
  - [ ] Feedback Text (textarea)
  - [ ] Product Image (file upload)
  - [ ] Warranty Card (file upload)
  - [ ] Parts Consumed Image (file upload)
- [ ] Add file upload validation
- [ ] Add file preview before upload
- [ ] Show upload progress
- [ ] Validate required fields

### Implement File Upload
- [ ] Create `lib/storage.ts` for Firebase Storage helpers
- [ ] Create `uploadFile()` function
- [ ] Create `deleteFile()` function
- [ ] Create `getDownloadURL()` helper
- [ ] Add file size validation (5MB limit)
- [ ] Add file type validation (images, PDF)
- [ ] Handle upload errors
- [ ] Generate unique file paths

### Create Resolution API
- [ ] Create `app/api/tickets/[id]/resolve/route.ts`
- [ ] POST endpoint to submit resolution
- [ ] Save resolution to Firestore `resolutions` collection
- [ ] Update ticket status to "closed"
- [ ] Set closedAt timestamp
- [ ] Create notification for ticket creator
- [ ] Return complete ticket with resolution

### Update Ticket Detail Page
- [ ] Show resolution form if ticket is open and user is technician
- [ ] Show resolution details if ticket is closed
- [ ] Display resolution images
- [ ] Show service rating
- [ ] Display feedback text
- [ ] Add "Reopen Ticket" button (admins only)

---

## 🔔 Session 7: Notifications System

### Create Notifications API
- [ ] Create `app/api/notifications/route.ts`
- [ ] GET endpoint to list user notifications
- [ ] Filter by userId from auth
- [ ] Sort by createdAt (newest first)
- [ ] Support pagination
- [ ] Return unread count

- [ ] Create `app/api/notifications/[id]/route.ts`
- [ ] PUT endpoint to mark as read
- [ ] DELETE endpoint to delete notification

- [ ] Create `app/api/notifications/mark-all-read/route.ts`
- [ ] PUT endpoint to mark all as read

### Create Notifications Hook
- [ ] Create `hooks/use-notifications.ts`
- [ ] `useNotifications()` - List notifications
- [ ] `useUnreadCount()` - Get unread count
- [ ] `useMarkAsRead()` - Mark single as read
- [ ] `useMarkAllRead()` - Mark all as read
- [ ] `useDeleteNotification()` - Delete notification
- [ ] Real-time listener with `subscribeToCollection()`

### Build Notifications UI
- [ ] Create `components/notifications/NotificationItem.tsx`
- [ ] Create `components/notifications/NotificationList.tsx`
- [ ] Update `components/layout/Header.tsx` bell icon
- [ ] Add dropdown with recent notifications
- [ ] Update badge count in Header
- [ ] Update Sidebar notification count

### Update Notifications Page
- [ ] Replace placeholder in `app/(app)/notifications/page.tsx`
- [ ] Show all notifications list
- [ ] Add "Mark all as read" button
- [ ] Add delete notification action
- [ ] Show empty state
- [ ] Add loading skeleton
- [ ] Link to related tickets

---

## 📊 Session 8: Dashboard

### Create Dashboard Components
- [ ] Create `components/dashboard/StatCard.tsx`
- [ ] Create `components/dashboard/TicketChart.tsx`
- [ ] Create `components/dashboard/RecentTickets.tsx`
- [ ] Create `components/dashboard/QuickActions.tsx`

### Implement Dashboard API
- [ ] Create `app/api/dashboard/stats/route.ts`
- [ ] Count total tickets
- [ ] Count open tickets
- [ ] Count closed tickets
- [ ] Count tickets by status
- [ ] Count tickets by brand
- [ ] Calculate average resolution time
- [ ] Get tickets created this week
- [ ] Cache stats for performance

### Update Dashboard Page
- [ ] Replace placeholder in `app/(app)/dashboard/page.tsx`
- [ ] Add 4 stat cards (total, open, closed, avg resolution)
- [ ] Add ticket status chart (recharts)
- [ ] Add recent tickets list (last 5)
- [ ] Add quick actions (Create Ticket, View All)
- [ ] Make responsive
- [ ] Add loading states

---

## 👥 Session 9: User Management

### Create User Management API
- [ ] Create `app/api/users/route.ts`
- [ ] GET endpoint to list all users (full_developer_admin only)
- [ ] POST endpoint to create new user
- [ ] Create Firebase Auth user
- [ ] Set custom claims
- [ ] Create Firestore profile

- [ ] Create `app/api/users/[id]/route.ts`
- [ ] GET endpoint for single user
- [ ] PUT endpoint to update user
- [ ] DELETE endpoint to deactivate user (don't delete Auth)

### Create User Management Hooks
- [ ] Create `hooks/use-users.ts`
- [ ] `useUsers()` - List all users
- [ ] `useUser(id)` - Get single user
- [ ] `useCreateUser()` - Create new user
- [ ] `useUpdateUser()` - Update user
- [ ] `useDeactivateUser()` - Deactivate user

### Build User Management UI
- [ ] Create `components/users/UserCard.tsx`
- [ ] Create `components/users/UserList.tsx`
- [ ] Create `components/users/UserForm.tsx` (create/edit)
- [ ] Create `components/users/UserDialog.tsx`

### Update Users Page
- [ ] Replace placeholder in `app/(app)/users/page.tsx`
- [ ] Show users list with role badges
- [ ] Add "Create User" button
- [ ] Add search and filter by role
- [ ] Add edit user action
- [ ] Add deactivate user action
- [ ] Show active/inactive status
- [ ] Restrict to full_developer_admin only

---

## 🔒 Security & Deployment

### Firestore Security Rules
- [ ] Create `firestore.rules` file
- [ ] Rules for `users` collection
- [ ] Rules for `tickets` collection
- [ ] Rules for `resolutions` collection
- [ ] Rules for `notifications` collection
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

### Storage Security Rules
- [ ] Create `storage.rules` file
- [ ] Rules for ticket attachments
- [ ] Rules for resolution images
- [ ] Validate file types and sizes
- [ ] Deploy rules: `firebase deploy --only storage`

### Environment Setup
- [ ] Create `.env.production` for production
- [ ] Set up Vercel project
- [ ] Add environment variables in Vercel
- [ ] Configure custom domain
- [ ] Enable Vercel Analytics

---

## 🧪 Testing & Quality

### Testing
- [ ] Add Jest and React Testing Library
- [ ] Write unit tests for utilities
- [ ] Write component tests
- [ ] Write API route tests
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD with GitHub Actions

### Code Quality
- [ ] Run `npm run lint` and fix issues
- [ ] Add pre-commit hooks with Husky
- [ ] Set up Prettier for formatting
- [ ] Add commit message linting
- [ ] Document all components with JSDoc

### Performance
- [ ] Analyze bundle size
- [ ] Optimize images
- [ ] Add image lazy loading
- [ ] Implement virtual scrolling for long lists
- [ ] Add service worker for offline support
- [ ] Optimize Firestore queries with indexes

---

## 📚 Documentation

- [ ] Update README.md with deployment instructions
- [ ] Create API documentation
- [ ] Create user guide
- [ ] Create admin guide
- [ ] Record demo video
- [ ] Create troubleshooting guide

---

## 🎨 Polish & UX

### UI Improvements
- [ ] Add loading skeletons everywhere
- [ ] Add empty states for all lists
- [ ] Add error boundaries
- [ ] Add 404 page
- [ ] Add 500 error page
- [ ] Improve mobile experience
- [ ] Add keyboard shortcuts
- [ ] Add accessibility labels

### Features
- [ ] Add ticket comments system
- [ ] Add ticket history/timeline
- [ ] Add ticket assignment workflow
- [ ] Add bulk operations
- [ ] Add export to CSV
- [ ] Add print ticket functionality
- [ ] Add WhatsApp share button
- [ ] Add ticket search with highlights

---

## 🚀 Launch Checklist

- [ ] All features implemented
- [ ] All tests passing
- [ ] Security rules deployed
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] User training conducted
- [ ] Staging environment tested
- [ ] Production environment ready
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Launch! 🎉

---

**Progress**: 42 of ~120 tasks complete (35%)  
**Next Focus**: Resolution Workflow  
**Estimated Completion**: 5-7 days
