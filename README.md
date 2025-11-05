# Complaint Management System

> 🎉 **Status**: Feature-Complete (v1.0.0) | Built with Next.js 16 + React 19 + Firebase + TypeScript

A comprehensive IT complaint/ticket management system with role-based access control, real-time notifications, file attachments, and complete user management.

## ✨ Features

### 🎫 Ticket Management
- Create tickets with attachments (images, PDFs up to 5MB)
- Filter and search tickets by status, priority, category
- Assign tickets to technicians
- Track ticket status (open → in progress → closed)
- Resolution workflow with ratings and images

### 🔔 Real-Time Notifications
- In-app notifications for ticket events
- Header bell icon with unread badge
- Auto-refresh every 30 seconds
- Mark as read/delete actions

### 📊 Dashboard & Analytics
- Role-based statistics
- 7-day trend calculations
- Recent activity feed
- Percentage change indicators

### 👥 User Management (Admin Only)
- Complete CRUD operations
- Firebase Admin integration for Auth + Firestore
- Custom claims for role-based permissions
- Smart deletion from both Auth and Firestore
- Ticket reassignment on user deletion

### 🔐 Authentication & Authorization
- Firebase Authentication
- 4 role levels: User, Technician, IT Admin, Full Admin
- Protected routes with middleware
- Custom claims for fine-grained permissions

## 🚀 Tech Stack

**Frontend**:
- Next.js 16.0.1 (App Router)
- React 19.2.0
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui components

```
complaint_management_system/
├── app/
│   ├── (app)/                    # Authenticated routes
│   │   ├── dashboard/            # Dashboard with stats
│   │   ├── tickets/              # Ticket management
│   │   │   ├── [id]/            # Ticket detail page
│   │   │   └── page.tsx         # Tickets list
│   │   ├── notifications/        # Notifications page
│   │   └── users/                # User management (admin)
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   └── register/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── tickets/
│   │   ├── notifications/
│   │   ├── dashboard/
│   │   └── users/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/                     # Auth components
│   ├── dashboard/                # Dashboard widgets
│   ├── layout/                   # Layout components
│   ├── notifications/            # Notification components
│   ├── tickets/                  # Ticket components
│   ├── users/                    # User management
│   └── ui/                       # shadcn/ui components
├── context/                      # Project documentation
├── docs/                         # Session documentation
├── firebase/
│   ├── admin.ts                  # Firebase Admin SDK
│   └── client.ts                 # Firebase Client SDK
├── hooks/                        # Custom React hooks
├── lib/
│   ├── auth.ts                   # Auth utilities
│   ├── storage.ts                # Storage utilities
│   └── utils.ts                  # General utilities
├── store/                        # Zustand stores
├── types/                        # TypeScript types
└── .env.local                    # Environment variables
```

## 📦 Installation

### Prerequisites
- Node.js 18+
- Firebase project
- npm/yarn/pnpm

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd complaint_management_system
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:
```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

4. **Run development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:3000
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- **[Project Summary](docs/project-summary.md)** - Complete project overview
- **[Session 6](docs/session-6-resolution-workflow.md)** - Resolution workflow
- **[Session 7](docs/session-7-notifications-system.md)** - Notifications system
- **[Session 8](docs/session-8-dashboard-statistics.md)** - Dashboard & analytics
- **[Session 9](docs/session-9-user-management.md)** - User management

Context documentation in `/context`:
- Project Requirements (PRD)
- Firebase Setup & Services
- Firestore Database Modeling
- Design System & Principles
- API Definitions

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Configure environment variables
- [ ] Deploy Firebase Security Rules
- [ ] Create Firestore indexes
- [ ] Test all features
- [ ] Run production build

### Firebase Setup

1. **Deploy Security Rules**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

2. **Create Firestore Indexes**
```bash
firebase deploy --only firestore:indexes
```

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

3. **Configure Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard

## 🔐 Security

### Firebase Security Rules

The project includes comprehensive Security Rules for:
- **Firestore**: Role-based document access
- **Storage**: File upload restrictions (5MB, images/PDFs only)

Rules are defined in:
- `firestore.rules` (to be created)
- `storage.rules` (to be created)

### Authentication

- Firebase Authentication with email/password
- Custom claims for role-based permissions
- Protected API routes with middleware
- Server-side session verification

## 🧪 Testing

### Manual Testing Checklist

See `/docs/session-9-user-management.md` for comprehensive testing checklist covering:
- API endpoints
- UI components
- Integration flows
- Error handling

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/[id]` - Get ticket
- `PUT /api/tickets/[id]` - Update ticket
- `POST /api/tickets/[id]/resolve` - Resolve ticket

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/[id]` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

### Users (Admin Only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

[Add your license here]

## 👨‍💻 Developer

Built with ❤️ using Next.js, React, and Firebase

---

**Version**: 1.0.0  
**Status**: 🎉 Feature-Complete  
**Last Updated**: January 2025
