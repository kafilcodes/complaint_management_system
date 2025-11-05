# Scripts Directory

This directory contains utility scripts for managing the ServiceFirst Complaint Management System.

## Available Scripts

### 🌱 Seed Users (`seed-users.ts`)

Creates pre-seeded test accounts in Firebase Authentication and Firestore.

**Usage:**
```bash
npm run seed:users
```

**What it does:**
- Creates 6 test accounts (1 Developer Admin, 1 Admin, 4 Employees)
- Sets up users in Firebase Auth with email verification
- Creates corresponding Firestore documents with profile data
- Sets custom claims for role-based access control
- Provides credentials table at the end

**Accounts created:**
1. Developer Admin: `admin@gmail.com` / `admin@99999`
2. System Admin: `admin@servicefirst.com` / `admin@12345`
3. Employee (John): `john.employee@servicefirst.com` / `employee@123`
4. Employee (Sarah): `sarah.employee@servicefirst.com` / `employee@123`
5. Employee (Mike): `mike.employee@servicefirst.com` / `employee@123`
6. Employee (Lisa): `lisa.employee@servicefirst.com` / `employee@123`

**Note:** The script checks for existing users and won't create duplicates.

---

### 🔍 Verify Users (`verify-users.ts`)

Verifies that all seeded users exist and are properly configured in both Firebase Auth and Firestore.

**Usage:**
```bash
npm run verify:users
```

**What it checks:**
- ✅ User exists in Firebase Authentication
- ✅ User exists in Firestore `users` collection
- ✅ Custom claims (role) are set correctly
- ✅ User data matches expected values
- ✅ User status is "active"

**Output:**
- Detailed verification for each user
- Summary table with status
- Exit code 0 if all verified, 1 if any issues

---

## Prerequisites

Both scripts require:

1. **Environment Variables** (`.env.local`):
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY=your-private-key
   ```

2. **Service Account Key** (`context/complaint-management-pwa-firebase-adminsdk-fbsvc-*.json`):
   - Downloaded from Firebase Console
   - Required for Admin SDK authentication

3. **Dependencies**:
   - `firebase-admin` - Firebase Admin SDK
   - `tsx` - TypeScript execution
   - `dotenv` - Environment variable loading

---

## Troubleshooting

### Error: "Firebase Admin SDK initialization failed"
**Solution:** Check that your service account JSON file exists and the path is correct.

### Error: "Missing environment variables"
**Solution:** Ensure `.env.local` contains all required Firebase variables.

### Error: "User already exists"
**Solution:** This is normal. The seed script detects existing users and skips them.

### Error: "Permission denied"
**Solution:** Verify your Firebase service account has the necessary permissions.

---

## Development Guidelines

### Adding New Seed Data

To add more test users, edit `seed-users.ts`:

```typescript
const SEED_USERS = [
  // ... existing users
  {
    email: "new.user@servicefirst.com",
    password: "password123",
    name: "New User",
    role: "employee" as const,
    phone: "+1234567896",
    department: "Department Name",
    employeeId: "EMP005",
  },
];
```

### Creating New Scripts

1. Create a new TypeScript file in `scripts/`
2. Add the script command to `package.json`:
   ```json
   "scripts": {
     "your-script": "tsx scripts/your-script.ts"
   }
   ```
3. Use the Firebase Admin SDK initialization pattern
4. Include proper error handling and logging

---

## Security Notes

⚠️ **IMPORTANT:**

- Never commit service account keys to version control
- Never use test passwords in production
- Always use strong passwords for production accounts
- Regularly rotate service account keys
- Use Firebase Security Rules to protect data

---

## Related Documentation

- [Test Accounts Documentation](../docs/test-accounts.md) - Full list of credentials and permissions
- [Firebase Setup Guide](../context/Firebase%20Setup%20&%20Services.md) - Firebase configuration
- [User Management Documentation](../docs/session-9-user-management.md) - User management features

---

**Last Updated:** November 4, 2025
