import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { verifyAuth } from "@/lib/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "it_technician" | "it_admin" | "full_developer_admin";
  phone?: string;
  createdAt: string;
  disabled?: boolean;
  lastLogin?: string;
}

/**
 * GET /api/users
 * List all users (admin only)
 * 
 * Query params:
 * - role: filter by role
 * - search: search by name or email
 * - limit: number of users (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only full_developer_admin can manage users
    if (user.role !== "full_developer_admin") {
      return NextResponse.json(
        { error: "Forbidden - Only full admins can manage users" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const searchQuery = searchParams.get("search")?.toLowerCase();
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Fetch all users from Firestore
    let query = adminDb.collection("users").limit(limit);
    
    if (roleFilter) {
      query = query.where("role", "==", roleFilter) as any;
    }

    const snapshot = await query.get();
    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];

    // Client-side search (Firestore doesn't support text search)
    if (searchQuery) {
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery) ||
          u.email?.toLowerCase().includes(searchQuery)
      );
    }

    // Fetch additional user data from Firebase Auth (disabled status, last login)
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          const authUser = await adminAuth.getUser(user.id);
          return {
            ...user,
            disabled: authUser.disabled,
            lastLogin: authUser.metadata.lastSignInTime || undefined,
          };
        } catch (error) {
          // If auth record doesn't exist, return user as-is
          return user;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
      count: enrichedUsers.length,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (admin only)
 * 
 * Body: { email, password, name, role, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Only full_developer_admin can manage users
    if (user.role !== "full_developer_admin") {
      return NextResponse.json(
        { error: "Forbidden - Only full admins can manage users" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, password, name, role, phone } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Email, password, name, and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["user", "it_technician", "it_admin", "full_developer_admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Set custom claims for role
    await adminAuth.setCustomUserClaims(authUser.uid, { role });

    // Create user document in Firestore
    const userData = {
      email,
      name,
      role,
      phone: phone || null,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    await adminDb.collection("users").doc(authUser.uid).set(userData);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          id: authUser.uid,
          ...userData,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    // Handle specific Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    
    if (error.code === "auth/invalid-email") {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
