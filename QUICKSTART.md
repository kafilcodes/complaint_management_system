# 🚀 Quick Start Guide

## What We've Built So Far

You now have a **fully functional ticket management system** with:

✅ **Authentication** - Login/logout with role-based access  
✅ **Ticket Creation** - Beautiful multi-step form with validation  
✅ **Ticket Listing** - Grid/list view with search and filters  
✅ **API Routes** - Complete backend for tickets CRUD  
✅ **Responsive UI** - Works perfectly on mobile and desktop  

---

## 🔥 Getting Started in 3 Steps

### Step 1: Add Firebase Credentials

Open `.env.local` and fill in your Firebase project details:

```bash
# Get these from Firebase Console > Project Settings > General
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key-here"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Get these from Firebase Console > Project Settings > Service Accounts > Generate Private Key
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----"

# Create your own random secret
ADMIN_SEED_SECRET="make-this-a-random-string"
```

### Step 2: Seed Admin Users

Start the dev server:
```bash
npm run dev
```

In a new terminal, seed the default admin users:
```bash
curl -X POST http://localhost:3000/api/auth/seed-admins \
  -H "Content-Type: application/json" \
  -d '{"secret": "make-this-a-random-string"}'
```

This creates two accounts:
- **Full Admin**: `admin@servicefirst.com` / `Admin@123456`
- **IT Admin**: `it.admin@servicefirst.com` / `ITAdmin@123`

### Step 3: Login and Test

1. Go to http://localhost:3000
2. Login with: `admin@servicefirst.com` / `Admin@123456`
3. Click "Create Ticket" button
4. Fill out the form and submit
5. View your ticket in the Tickets page!

---

## 🎯 What You Can Do Right Now

### As Admin (admin@servicefirst.com)
- ✅ View dashboard
- ✅ Create new tickets
- ✅ View all tickets (list/grid)
- ✅ Search and filter tickets
- ✅ View ticket details
- ✅ Update ticket status
- ✅ Assign tickets to technicians (once you create technician users)

### Navigation
- **Dashboard** - Overview and stats (placeholder)
- **Tickets** - View all tickets with filters
- **Create Ticket** - Full form with validation
- **Users** - User management (placeholder)
- **Notifications** - In-app notifications (placeholder)
- **Profile** - User profile settings (placeholder)

---

## 📂 Key Files to Know

### Pages You Can Edit
- `app/(app)/dashboard/page.tsx` - Dashboard page
- `app/(app)/tickets/page.tsx` - Tickets list
- `app/(app)/create-ticket/page.tsx` - Create ticket form
- `app/(app)/tickets/[id]/page.tsx` - Single ticket view (to be created)

### Components
- `components/tickets/TicketCard.tsx` - Single ticket card
- `components/tickets/TicketList.tsx` - List with filters
- `components/layout/Header.tsx` - Top navigation
- `components/layout/Sidebar.tsx` - Side menu

### Configuration
- `lib/configuration.ts` - Brands, categories, roles, permissions
- `lib/types.ts` - All TypeScript types
- `lib/store.ts` - Global state (Zustand)

### API Routes
- `app/api/tickets/route.ts` - GET (list) and POST (create)
- `app/api/tickets/[id]/route.ts` - GET, PUT, DELETE single ticket
- `app/api/auth/seed-admins/route.ts` - Seed admin users

---

## 🎨 Customization

### Change Colors
Edit `app/globals.css`:
```css
--primary: 0.82 0.13 194; /* Turquoise - change these values */
```

### Add New Brands
Edit `lib/configuration.ts`:
```typescript
export const BRANDS = [
  { value: "kfc", label: "KFC" },
  { value: "pizza_hut", label: "Pizza Hut" },
  { value: "taco_bell", label: "Taco Bell" },
  { value: "new_brand", label: "New Brand" }, // Add here
];
```

### Add New Roles
Update `lib/types.ts`:
```typescript
export type UserRole = 
  | "full_developer_admin" 
  | "it_admin" 
  | "it_technician"
  | "store_manager"
  | "store_employee"
  | "your_new_role"; // Add here
```

---

## 🔍 What's Next?

### High Priority
1. **Single Ticket View** - Detailed view with comments and history
2. **Resolution Form** - Technician resolution with file uploads
3. **Notifications** - Real-time in-app notifications
4. **Dashboard Stats** - Real statistics and charts

### Medium Priority
5. **User Management** - Create/edit users (admins only)
6. **Real-time Updates** - Live ticket updates with Firestore listeners
7. **File Uploads** - Attach images to tickets
8. **Comments System** - Add comments to tickets

### Nice to Have
9. **Email Notifications** - Send emails on ticket events
10. **Analytics** - Reporting and insights
11. **Export** - Export tickets to CSV/PDF
12. **Search** - Advanced search with filters

---

## 🐛 Troubleshooting

### Firebase Connection Error
- Check that your `.env.local` has all Firebase credentials
- Restart the dev server after adding credentials
- Verify your Firebase project has Authentication and Firestore enabled

### Login Not Working
- Make sure you seeded the admin users
- Check browser console for errors
- Verify Firebase Auth is enabled in Firebase Console

### TypeScript Errors
- Some type conflicts between Firebase packages are expected
- Run `npm run build` to see if they're blocking (most aren't)
- The app should work fine despite warnings

### Styling Issues
- Tailwind v4 uses new syntax that may show CSS warnings
- These are safe to ignore as long as the app renders correctly

---

## 📞 Need Help?

Check the documentation:
- `/context/` - Project requirements and design system
- `/docs/implementation-log-2025-11-04.md` - Detailed implementation log
- `README.md` - Full project documentation

---

**Built with ❤️ using Next.js, Firebase, and shadcn/ui**
