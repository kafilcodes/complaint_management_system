# Session 9: User Management with Firebase Admin

**Date:** January 2025  
**Status:** ✅ Completed  
**Module:** User Management & Administration

## 📋 Overview

Session 9 implements comprehensive user management capabilities using Firebase Admin SDK for both Authentication and Firestore operations. This allows full_developer_admin users to perform complete CRUD operations on user accounts, including creation, updates, role management, and deletion from both Firebase Auth and Firestore.

### Key Features

- **Firebase Admin Integration**: Direct Auth and Firestore management
- **Full CRUD Operations**: Create, read, update, and delete users
- **Custom Claims**: Role-based permissions via Firebase custom claims
- **Smart Deletion**: Removes users from BOTH Auth and Firestore
- **Ticket Management**: Handles ticket reassignment on user deletion
- **Status Control**: Enable/disable user accounts
- **Search & Filter**: Find users by name, email, or role
- **Form Validation**: Comprehensive Zod schemas with error handling

---

## 🏗️ Architecture

### System Flow

```
┌─────────────────┐
│   Users Page    │
│  (Admin Only)   │
└────────┬────────┘
         │
         ├─────────────┬─────────────┬──────────────┐
         │             │             │              │
    ┌────▼───┐   ┌────▼───┐   ┌─────▼────┐   ┌────▼────┐
    │ Create │   │  List  │   │   Edit   │   │ Delete  │
    │ Dialog │   │Component│   │  Dialog  │   │ Dialog  │
    └────┬───┘   └────┬───┘   └─────┬────┘   └────┬────┘
         │            │              │             │
         └────────────┴──────────────┴─────────────┘
                      │
                 ┌────▼────┐
                 │  Hooks  │
                 │use-users│
                 └────┬────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼─────┐            ┌─────▼──────┐
    │   API    │            │    API     │
    │  Routes  │            │  Routes    │
    │/api/users│            │/api/users/ │
    │          │            │    [id]    │
    └────┬─────┘            └─────┬──────┘
         │                         │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │   Firebase Admin SDK    │
         ├─────────────┬───────────┤
         │             │           │
    ┌────▼────┐   ┌───▼─────┐   ┌▼────────┐
    │  Auth   │   │Firestore│   │ Custom  │
    │ Users   │   │  Users  │   │ Claims  │
    └─────────┘   └─────────┘   └─────────┘
```

---

## 📁 Files Created

### API Routes (2 files)

#### 1. `app/api/users/route.ts` (~240 lines)

**Purpose**: Main users API for listing and creating users

**Endpoints**:
- `GET /api/users` - List all users
- `POST /api/users` - Create new user

**GET Features**:
- Query params: `role`, `search`, `limit`
- Fetches from Firestore with optional role filter
- Client-side search by name/email
- Enriches with Firebase Auth data (disabled status, last login)
- Returns user array + count

**POST Features**:
- Validates: email, password (min 6 chars), name, role
- Creates user in Firebase Auth
- Sets custom claims for role
- Creates Firestore user document
- Returns complete user object

**Authorization**: `full_developer_admin` only for both endpoints

**Error Handling**:
- `auth/email-already-exists` → 400
- `auth/invalid-email` → 400
- Weak password → 400
- Generic errors → 500

#### 2. `app/api/users/[id]/route.ts` (~350 lines)

**Purpose**: Individual user operations (get, update, delete)

**Endpoints**:
- `GET /api/users/[id]` - Get single user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

**GET Features**:
- Fetches from Firestore by ID
- Enriches with Auth data
- Returns 404 if not found

**PUT Features**:
- Updates: email, name, role, phone, disabled status
- Updates Firebase Auth properties
- Updates custom claims if role changed
- Updates Firestore document
- Prevents self-disable
- Prevents self-role-change
- Returns updated user

**DELETE Features** (Critical):
- **Deletes from BOTH Firebase Auth AND Firestore** (user's emphasis)
- Query param: `reassign` - user ID to reassign tickets to
- Prevents self-deletion
- Handles technician ticket reassignment:
  - If `reassign` provided → reassigns to target technician
  - If not provided → unassigns tickets (sets to null)
- Handles user tickets:
  - Marks as `createdByDeleted: true` for tracking
- Fallback: If Auth user not found, still deletes Firestore doc

**Authorization**: `full_developer_admin` only for all endpoints

---

### Hooks (1 file)

#### 3. `hooks/use-users.ts` (~240 lines)

**Purpose**: React Query hooks for user management

**Hooks**:

1. **`useUsers(filters?)`**
   - Fetches all users with optional filters
   - Filters: `role`, `search`, `limit`
   - Stale time: 60 seconds
   - Returns: `User[]`

2. **`useUser(userId)`**
   - Fetches single user by ID
   - Enabled only if userId provided
   - Returns: `User | null`

3. **`useCreateUser()`**
   - Mutation for creating users
   - Invalidates users cache on success
   - Toast notifications
   - Returns: `User`

4. **`useUpdateUser(userId)`**
   - Mutation for updating users
   - Invalidates users and specific user cache
   - Toast notifications
   - Returns: `User`

5. **`useDeleteUser()`**
   - Mutation for deleting users
   - Accepts `userId` and optional `reassignTo`
   - Invalidates users cache
   - Toast notifications
   - Returns: deletion result

6. **`useToggleUserStatus(userId)`**
   - Mutation for enabling/disabling users
   - Updates `disabled` field only
   - Invalidates caches
   - Toast notifications

**Types**:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "it_technician" | "it_admin" | "full_developer_admin";
  phone?: string;
  createdAt: string;
  disabled?: boolean;
  lastLogin?: string;
}
```

---

### Components (4 files)

#### 4. `components/users/UserList.tsx` (~290 lines)

**Purpose**: Main user list with table and actions

**Features**:
- **Search**: Real-time search by name or email
- **Filter**: Dropdown to filter by role
- **Table**: Displays users with columns:
  - Name
  - Email
  - Role (colored badges)
  - Status (Active/Disabled badges)
  - Last Login (time ago)
  - Created (time ago)
  - Actions (dropdown)
- **Actions**:
  - Edit User
  - Enable/Disable User
  - Delete User
- **Loading States**: Skeleton loaders
- **Empty State**: "No users found"
- **Results Count**: Shows total filtered users

**Role Colors**:
- User: Gray (default)
- Technician: Blue
- IT Admin: Purple
- Full Admin: Red

**Confirmation Dialogs**:
- Toggle status confirmation (enable/disable)

#### 5. `components/users/CreateUserDialog.tsx` (~200 lines)

**Purpose**: Dialog for creating new users

**Form Fields**:
- Name (required, min 2 chars)
- Email (required, valid email)
- Password (required, min 6 chars)
- Role (required, dropdown)
- Phone (optional)

**Validation**: Zod schema with react-hook-form

**Features**:
- Form reset on success
- Loading state during submission
- Error messages below each field
- Success toast on creation

#### 6. `components/users/EditUserDialog.tsx` (~210 lines)

**Purpose**: Dialog for editing existing users

**Form Fields**:
- Name (required)
- Email (required)
- Role (required)
- Phone (optional)
- Note: No password field (use Firebase Console for password reset)

**Features**:
- Loads current user data
- Updates form when user changes
- Loading skeleton while fetching
- Form reset on cancel
- Success toast on update

#### 7. `components/users/DeleteUserDialog.tsx` (~140 lines)

**Purpose**: Confirmation dialog for user deletion

**Features**:
- Shows user name and email
- **Warning Banner**: Red background, emphasizes permanent deletion
- **Dual Deletion Notice**: "Deleted from both Firebase Authentication and Firestore"
- **Ticket Reassignment** (for technicians):
  - Dropdown to select another technician
  - Option to leave unassigned
  - Only shows if user has assigned tickets
- Destructive action button (red)
- Loading state during deletion

**Safety Measures**:
- Cannot delete self
- Clear warning about permanent action
- Explicit confirmation required

---

### Page (1 file)

#### 8. `app/(app)/users/page.tsx` (~70 lines)

**Purpose**: Main users management page

**Structure**:
- Page header with title and description
- "Create User" button (top right)
- UserList component in card container
- All 3 dialogs (create, edit, delete)

**State Management**:
- `createDialogOpen` - boolean for create dialog
- `editUserId` - string | null for edit dialog
- `deleteUserId` - string | null for delete dialog

**Handlers**:
- `handleEdit(userId)` - Opens edit dialog
- `handleDelete(userId)` - Opens delete dialog

**Note**: Changed from server component to client component ("use client")

---

## 🔄 Data Flow

### 1. List Users Flow

```
User visits /users
     ↓
Page renders UserList
     ↓
useUsers() hook fetches
     ↓
GET /api/users?role=X&search=Y
     ↓
verifyAuth (check full_developer_admin)
     ↓
Firestore: users collection query
     ↓
Firebase Auth: enrich with disabled + lastLogin
     ↓
Client-side search filter
     ↓
Return { success, data: User[], count }
     ↓
Table renders with users
```

### 2. Create User Flow

```
Admin clicks "Create User"
     ↓
CreateUserDialog opens
     ↓
Admin fills form (email, password, name, role, phone)
     ↓
Form validation (Zod)
     ↓
useCreateUser().mutate()
     ↓
POST /api/users
     ↓
verifyAuth (check full_developer_admin)
     ↓
Validate: email, password, role
     ↓
Firebase Auth: createUser()
     ↓
Firebase Auth: setCustomUserClaims({ role })
     ↓
Firestore: create user document
     ↓
Return { success, data: User }
     ↓
Invalidate users cache
     ↓
Toast: "User created successfully"
     ↓
Dialog closes
     ↓
Table auto-refreshes with new user
```

### 3. Update User Flow

```
Admin clicks "Edit" on user
     ↓
EditUserDialog opens with userId
     ↓
useUser(userId) fetches current data
     ↓
Form populates with existing values
     ↓
Admin changes fields
     ↓
Form validation (Zod)
     ↓
useUpdateUser(userId).mutate()
     ↓
PUT /api/users/[id]
     ↓
verifyAuth (check full_developer_admin)
     ↓
Prevent self-disable check
     ↓
Prevent self-role-change check
     ↓
Firebase Auth: updateUser() (email, name, disabled)
     ↓
Firebase Auth: setCustomUserClaims() (if role changed)
     ↓
Firestore: update user document
     ↓
Return { success, data: User }
     ↓
Invalidate users + user cache
     ↓
Toast: "User updated successfully"
     ↓
Dialog closes
     ↓
Table auto-refreshes
```

### 4. Delete User Flow (Critical)

```
Admin clicks "Delete" on user
     ↓
DeleteUserDialog opens with userId
     ↓
useUser(userId) fetches user data
     ↓
IF user is technician:
   useUsers({ role: 'it_technician' }) fetches reassignment options
     ↓
Dialog shows:
  - User name/email
  - Warning about permanent deletion
  - "Deleted from BOTH Auth and Firestore" notice
  - Reassignment dropdown (if technician)
     ↓
Admin confirms deletion
     ↓
useDeleteUser().mutate({ userId, reassignTo? })
     ↓
DELETE /api/users/[id]?reassign=X
     ↓
verifyAuth (check full_developer_admin)
     ↓
Prevent self-deletion check
     ↓
IF user is technician/admin:
   Query assigned tickets
   IF reassignTo provided:
      Batch update tickets → new assignee
   ELSE:
      Batch update tickets → null (unassigned)
     ↓
IF user is regular user:
   Query created tickets
   Batch update tickets → createdByDeleted: true
     ↓
Firebase Auth: deleteUser(uid)  ← AUTH DELETION
     ↓
Firestore: delete user document  ← FIRESTORE DELETION
     ↓
Return { success, message, ticketsReassigned }
     ↓
Invalidate users cache
     ↓
Toast: "User deleted successfully from both Auth and Firestore"
     ↓
Dialog closes
     ↓
Table auto-refreshes (user removed)
```

---

## 🔐 Security & Authorization

### Role Requirements

**ALL endpoints require**: `full_developer_admin` role

**Verification Flow**:
```typescript
const { authenticated, user, error } = await verifyAuth(request);
if (!authenticated || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
if (user.role !== "full_developer_admin") {
  return NextResponse.json(
    { error: "Forbidden - Only full admins can manage users" },
    { status: 403 }
  );
}
```

### Safety Checks

1. **Prevent Self-Disable**:
   - Users cannot set `disabled: true` on their own account
   - Checked in PUT endpoint

2. **Prevent Self-Role-Change**:
   - Users cannot change their own role
   - Prevents privilege escalation/de-escalation

3. **Prevent Self-Deletion**:
   - Users cannot delete their own account
   - Checked in DELETE endpoint

4. **Password Validation**:
   - Minimum 6 characters (Firebase requirement)
   - Enforced in POST endpoint

5. **Email Validation**:
   - Valid email format
   - No duplicates (Firebase enforces)

---

## 🎨 UI/UX Features

### Search & Filtering

**Search**:
- Real-time search as you type
- Searches both name and email fields
- Case-insensitive
- Client-side (fast)

**Filter**:
- Dropdown with 5 options:
  - All Roles
  - User
  - Technician
  - IT Admin
  - Full Admin
- Server-side filtering (efficient for large datasets)

### Visual Indicators

**Role Badges**:
- Color-coded for quick recognition
- User: Gray
- Technician: Blue
- IT Admin: Purple
- Full Admin: Red

**Status Badges**:
- Active: Green outline
- Disabled: Red filled

**Time Formatting**:
- "2 hours ago", "5 days ago", etc.
- Uses date-fns `formatDistanceToNow()`

### Loading States

**Skeleton Loaders**:
- 2 skeleton bars for filters
- 1 large skeleton for table
- 4 skeletons in edit dialog

**Button States**:
- Disabled during mutations
- Loading spinner icon
- Prevents double-submission

### Empty States

**No Users**:
- "No users found" message
- Centered in table

**No Reassignment Options**:
- Only shows reassignment if other technicians exist
- "Leave unassigned" is default

---

## 📊 Data Models

### User Interface

```typescript
interface User {
  id: string;                    // Firebase UID
  email: string;                 // User's email
  name: string;                  // Display name
  role: Role;                    // Permission level
  phone?: string;                // Optional phone
  createdAt: string;             // ISO timestamp
  disabled?: boolean;            // Account status (from Auth)
  lastLogin?: string;            // ISO timestamp (from Auth)
}

type Role = 
  | "user"
  | "it_technician"
  | "it_admin"
  | "full_developer_admin";
```

### Form Schemas

**Create User**:
```typescript
{
  name: string (min 2),
  email: email(),
  password: string (min 6),
  role: enum,
  phone?: string
}
```

**Edit User**:
```typescript
{
  name: string (min 2),
  email: email(),
  role: enum,
  phone?: string
}
// Note: No password (use Firebase Console to reset)
```

---

## 🧪 Testing Checklist

### API Endpoints

- [ ] **GET /api/users**
  - [ ] Returns all users for full admin
  - [ ] Returns 403 for non-admins
  - [ ] Filters by role work
  - [ ] Search by name works
  - [ ] Search by email works
  - [ ] Limit parameter works
  - [ ] Enriched with Auth data (disabled, lastLogin)

- [ ] **POST /api/users**
  - [ ] Creates user in Firebase Auth
  - [ ] Sets custom claims correctly
  - [ ] Creates Firestore document
  - [ ] Validates email format
  - [ ] Validates password length (min 6)
  - [ ] Returns 400 for duplicate email
  - [ ] Returns 403 for non-admins

- [ ] **GET /api/users/[id]**
  - [ ] Returns user by ID
  - [ ] Returns 404 for non-existent user
  - [ ] Returns 403 for non-admins

- [ ] **PUT /api/users/[id]**
  - [ ] Updates Firebase Auth properties
  - [ ] Updates custom claims on role change
  - [ ] Updates Firestore document
  - [ ] Prevents self-disable
  - [ ] Prevents self-role-change
  - [ ] Returns 400 for duplicate email
  - [ ] Returns 403 for non-admins

- [ ] **DELETE /api/users/[id]**
  - [ ] Deletes from Firebase Auth ✅ CRITICAL
  - [ ] Deletes from Firestore ✅ CRITICAL
  - [ ] Prevents self-deletion
  - [ ] Reassigns tickets when reassignTo provided
  - [ ] Unassigns tickets when reassignTo not provided
  - [ ] Marks user tickets as createdByDeleted
  - [ ] Returns success even if Auth user not found (Firestore cleanup)
  - [ ] Returns 403 for non-admins

### UI Components

- [ ] **UserList**
  - [ ] Displays all users in table
  - [ ] Search filters correctly
  - [ ] Role filter works
  - [ ] Edit action opens dialog
  - [ ] Delete action opens dialog
  - [ ] Toggle status opens confirmation
  - [ ] Shows correct badges
  - [ ] Shows "No users found" when empty

- [ ] **CreateUserDialog**
  - [ ] Opens when "Create User" clicked
  - [ ] All fields validate correctly
  - [ ] Shows error messages
  - [ ] Disables button during submission
  - [ ] Shows success toast
  - [ ] Closes on success
  - [ ] Resets form on success

- [ ] **EditUserDialog**
  - [ ] Opens with correct user data
  - [ ] Populates form correctly
  - [ ] Validates changes
  - [ ] Shows loading skeleton
  - [ ] Shows success toast
  - [ ] Closes on success

- [ ] **DeleteUserDialog**
  - [ ] Shows user name/email
  - [ ] Shows warning about permanent deletion
  - [ ] Shows "Both Auth and Firestore" notice ✅ CRITICAL
  - [ ] Shows reassignment dropdown for technicians
  - [ ] Hides reassignment for regular users
  - [ ] Filters out user being deleted from reassignment options
  - [ ] Shows destructive styling
  - [ ] Shows loading state
  - [ ] Shows success toast
  - [ ] Closes on success

### Integration

- [ ] **Full Flow Testing**
  - [ ] Create user → appears in list
  - [ ] Edit user → changes reflected
  - [ ] Disable user → badge changes to "Disabled"
  - [ ] Enable user → badge changes to "Active"
  - [ ] Delete user → removed from list
  - [ ] Delete user → gone from Firebase Auth
  - [ ] Delete user → gone from Firestore
  - [ ] Delete technician → tickets reassigned correctly
  - [ ] Search → filters results
  - [ ] Role filter → shows only selected role

- [ ] **Error Handling**
  - [ ] Duplicate email → shows error
  - [ ] Invalid email → shows error
  - [ ] Weak password → shows error
  - [ ] Network error → shows toast
  - [ ] Permission denied → shows 403

---

## 🚀 Future Enhancements

### Phase 1: Immediate
- [ ] **Email Verification**: Send verification email on user creation
- [ ] **Password Reset**: Trigger password reset email from UI
- [ ] **Bulk Actions**: Select multiple users for bulk operations
- [ ] **Export Users**: Download user list as CSV

### Phase 2: Enhanced Features
- [ ] **User Activity Log**: Track all user management actions
- [ ] **Advanced Filters**: Created date range, last login range
- [ ] **Pagination**: Load users in pages (not all at once)
- [ ] **Sort Table**: Click column headers to sort

### Phase 3: Advanced
- [ ] **User Impersonation**: Admin login as user (for support)
- [ ] **Role Permissions Editor**: Visual UI for custom permissions
- [ ] **User Groups**: Group users for bulk permissions
- [ ] **2FA Management**: Enable/disable 2FA for users

---

## 📝 Usage Examples

### Create a New User

```typescript
// Using the hook directly
const createUser = useCreateUser();

createUser.mutate({
  email: "john@example.com",
  password: "secure123",
  name: "John Doe",
  role: "it_technician",
  phone: "+1 555-0100"
});

// Via UI: Click "Create User" button, fill form, submit
```

### Update a User

```typescript
const updateUser = useUpdateUser(userId);

updateUser.mutate({
  name: "John Smith",
  role: "it_admin"
});

// Via UI: Click "Edit" in dropdown, modify form, submit
```

### Delete a User (with Ticket Reassignment)

```typescript
const deleteUser = useDeleteUser();

// Delete with reassignment
deleteUser.mutate({
  userId: "user123",
  reassignTo: "technician456"
});

// Delete without reassignment
deleteUser.mutate({
  userId: "user123"
});

// Via UI: Click "Delete", optionally select reassignment, confirm
```

### Search and Filter

```typescript
// In component
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState("all");

const { data: users } = useUsers({
  search: search || undefined,
  role: roleFilter !== "all" ? roleFilter : undefined,
});

// Users automatically filtered
```

---

## 🔧 Configuration

### Firebase Admin Setup

Ensure Firebase Admin is initialized with service account:

```typescript
// firebase/admin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
```

### Environment Variables

Required:
```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 📖 Related Documentation

- **Firebase Admin Auth**: https://firebase.google.com/docs/auth/admin
- **Custom Claims**: https://firebase.google.com/docs/auth/admin/custom-claims
- **Firestore Admin**: https://firebase.google.com/docs/firestore/manage-data/delete-data
- **Session 8**: Dashboard Statistics (previous session)
- **Session 10**: Testing & Deployment (next session)

---

## ✅ Session Completion

### What Was Built

1. ✅ Complete users API (list, create, update, delete)
2. ✅ Firebase Admin integration for Auth + Firestore
3. ✅ Custom claims for role-based permissions
4. ✅ User management hooks with React Query
5. ✅ User list component with search & filters
6. ✅ Create, edit, and delete dialogs
7. ✅ Ticket reassignment on user deletion
8. ✅ **Dual deletion from BOTH Auth and Firestore** ✅ CRITICAL REQUIREMENT

### Key Achievements

- **Full Admin Control**: Complete CRUD for user accounts
- **Dual System Deletion**: Properly removes users from both Firebase Auth AND Firestore (user's emphasis)
- **Safe Operations**: Prevents self-disable, self-role-change, self-deletion
- **Smart Ticket Handling**: Reassignment and tracking on deletion
- **Polished UI**: Professional table, dialogs, badges, confirmations
- **Type Safety**: Full TypeScript coverage with strict types

### Files Modified/Created

**Created (8 files)**:
1. `app/api/users/route.ts` - List & create API
2. `app/api/users/[id]/route.ts` - Get, update, delete API
3. `hooks/use-users.ts` - User management hooks
4. `components/users/UserList.tsx` - User table component
5. `components/users/CreateUserDialog.tsx` - Create dialog
6. `components/users/EditUserDialog.tsx` - Edit dialog
7. `components/users/DeleteUserDialog.tsx` - Delete confirmation
8. `app/(app)/users/page.tsx` - Users page (modified)

**Dependencies Added**:
- `@/components/ui/table` (shadcn/ui)
- `@/components/ui/alert-dialog` (shadcn/ui)

---

## 🎯 Next Steps

With Session 9 complete, the application is **100% feature-complete**. The remaining work focuses on:

1. **Session 10: Testing & Deployment**
   - End-to-end testing
   - Firebase Security Rules
   - Firestore indexes
   - Production deployment
   - Performance optimization

2. **Documentation**
   - User manual
   - Admin guide
   - API documentation
   - Deployment guide

3. **Polish**
   - Final UI/UX review
   - Accessibility improvements
   - Mobile responsiveness
   - Error handling refinement

---

**Session 9 Status**: ✅ **COMPLETE**  
**Project Status**: 🎉 **100% FEATURE-COMPLETE**  
**Ready for**: Testing, Security Rules, Deployment
