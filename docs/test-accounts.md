# Test Account Credentials

## Overview
This document contains the credentials for pre-seeded test accounts in the ServiceFirst Complaint Management System. These accounts are created in both Firebase Authentication and Firestore with proper roles and custom claims.

## Security Notice
⚠️ **IMPORTANT**: These are test accounts only. Never use these credentials in production!

---

## Account List

### 1. Developer Admin Account 👨‍💻
**Role**: `full_developer_admin` (Full access to all features including user management)

- **Email**: `admin@gmail.com`
- **Password**: `admin@99999`
- **Name**: Developer Admin
- **Department**: Engineering
- **Employee ID**: DEV001
- **Phone**: +1234567890

**Permissions**:
- ✅ Create, read, update, delete users
- ✅ Assign roles and permissions
- ✅ Access all complaints and tickets
- ✅ View all analytics and reports
- ✅ Manage system settings
- ✅ Delete any user account

---

### 2. System Administrator Account 👔
**Role**: `admin` (Administrative access without developer privileges)

- **Email**: `admin@servicefirst.com`
- **Password**: `admin@12345`
- **Name**: System Administrator
- **Department**: Administration
- **Employee ID**: ADM001
- **Phone**: +1234567891

**Permissions**:
- ✅ View and manage complaints
- ✅ Assign tickets
- ✅ View analytics
- ✅ Manage departments
- ❌ Cannot manage users (read-only access)
- ❌ Cannot delete users

---

### 3. Employee Account - John Smith 👨‍💼
**Role**: `employee` (Standard employee access)

- **Email**: `john.employee@servicefirst.com`
- **Password**: `employee@123`
- **Name**: John Smith
- **Department**: Customer Service
- **Employee ID**: EMP001
- **Phone**: +1234567892

**Permissions**:
- ✅ View assigned tickets
- ✅ Update ticket status
- ✅ Add comments to tickets
- ✅ View department complaints
- ❌ Cannot create new tickets
- ❌ Cannot access user management

---

### 4. Employee Account - Sarah Johnson 👩‍💼
**Role**: `employee` (Standard employee access)

- **Email**: `sarah.employee@servicefirst.com`
- **Password**: `employee@123`
- **Name**: Sarah Johnson
- **Department**: Technical Support
- **Employee ID**: EMP002
- **Phone**: +1234567893

**Permissions**:
- ✅ View assigned tickets
- ✅ Update ticket status
- ✅ Add comments to tickets
- ✅ View department complaints
- ❌ Cannot create new tickets
- ❌ Cannot access user management

---

### 5. Employee Account - Mike Davis 👨‍🔧
**Role**: `employee` (Standard employee access)

- **Email**: `mike.employee@servicefirst.com`
- **Password**: `employee@123`
- **Name**: Mike Davis
- **Department**: Maintenance
- **Employee ID**: EMP003
- **Phone**: +1234567894

**Permissions**:
- ✅ View assigned tickets
- ✅ Update ticket status
- ✅ Add comments to tickets
- ✅ View department complaints
- ❌ Cannot create new tickets
- ❌ Cannot access user management

---

### 6. Employee Account - Lisa Martinez 👩‍💼
**Role**: `employee` (Standard employee access)

- **Email**: `lisa.employee@servicefirst.com`
- **Password**: `employee@123`
- **Name**: Lisa Martinez
- **Department**: Customer Service
- **Employee ID**: EMP004
- **Phone**: +1234567895

**Permissions**:
- ✅ View assigned tickets
- ✅ Update ticket status
- ✅ Add comments to tickets
- ✅ View department complaints
- ❌ Cannot create new tickets
- ❌ Cannot access user management

---

## Quick Reference Table

| Email | Password | Role | Name | Department |
|-------|----------|------|------|------------|
| `admin@gmail.com` | `admin@99999` | `full_developer_admin` | Developer Admin | Engineering |
| `admin@servicefirst.com` | `admin@12345` | `admin` | System Administrator | Administration |
| `john.employee@servicefirst.com` | `employee@123` | `employee` | John Smith | Customer Service |
| `sarah.employee@servicefirst.com` | `employee@123` | `employee` | Sarah Johnson | Technical Support |
| `mike.employee@servicefirst.com` | `employee@123` | `employee` | Mike Davis | Maintenance |
| `lisa.employee@servicefirst.com` | `employee@123` | `employee` | Lisa Martinez | Customer Service |

---

## Testing Scenarios

### Scenario 1: Developer Admin Testing
Use `admin@gmail.com` to test:
- User management (create, edit, delete users)
- Role assignment
- System configuration
- Full system access

### Scenario 2: Admin Testing
Use `admin@servicefirst.com` to test:
- Complaint management
- Ticket assignment
- Analytics viewing
- Limited permissions (cannot manage users)

### Scenario 3: Employee Testing
Use any employee account to test:
- Ticket viewing and updates
- Comment functionality
- Limited access controls
- Department-specific views

### Scenario 4: Multi-User Workflow
1. Login as `admin@servicefirst.com`
2. Create a new complaint
3. Assign ticket to `john.employee@servicefirst.com`
4. Login as John and update ticket status
5. View the changes as admin

---

## Re-seeding

If you need to recreate these accounts:

```bash
npm run seed:users
```

**Note**: The script checks if users already exist and won't create duplicates. If you need to completely reset:

1. Delete users from Firebase Console → Authentication
2. Delete user documents from Firestore → users collection
3. Run the seed script again

---

## Database Locations

### Firebase Authentication
- Console: https://console.firebase.google.com/project/complaint-management-pwa/authentication/users
- Each user has custom claims set for their role

### Firestore Database
- Collection: `users`
- Document ID: Same as Auth UID
- Contains: User profile data, preferences, metadata

---

## Additional Notes

- All accounts are automatically email-verified
- All accounts have `status: "active"` in Firestore
- All accounts have `isSeeded: true` in metadata
- Custom claims are set for role-based access control
- Passwords meet minimum security requirements for testing

---

**Created**: November 4, 2025
**Script**: `scripts/seed-users.ts`
**Total Accounts**: 6 (1 Developer Admin, 1 Admin, 4 Employees)
