/**
 * Seed Admin Users API Route
 * 
 * POST /api/auth/seed-admins
 * 
 * Creates default admin accounts for initial system setup.
 * This endpoint should only be used once during initial deployment.
 * Protected by a secret key to prevent unauthorized access.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

/**
 * Default admin users to seed
 */
const DEFAULT_ADMINS = [
  {
    email: "admin@MParekh.com",
    password: "Admin@123456",
    name: "System Administrator",
    phone: "+1234567890",
    role: "full_developer_admin",
  },
  {
    email: "it.admin@MParekh.com",
    password: "ITAdmin@123",
    name: "IT Administrator",
    phone: "+1234567891",
    role: "it_admin",
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    // Verify the secret key
    const { secret } = await request.json();

    if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized. Invalid or missing secret key." 
        },
        { status: 401 }
      );
    }

    const results = [];

    // Create each admin user
    for (const admin of DEFAULT_ADMINS) {
      try {
        // Check if user already exists
        const auth = getAuth();
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(admin.email);
          results.push({
            email: admin.email,
            status: "already_exists",
            uid: userRecord.uid,
          });
          continue;
        } catch (error: any) {
          // User doesn't exist, create it
          if (error.code === "auth/user-not-found") {
            userRecord = await auth.createUser({
              email: admin.email,
              password: admin.password,
              displayName: admin.name,
              emailVerified: true,
            });
          } else {
            throw error;
          }
        }

        // Set custom claims for the user
        await auth.setCustomUserClaims(userRecord.uid, {
          role: admin.role,
        });

        // Create Firestore user document
        await db.collection("users").doc(userRecord.uid).set({
          email: admin.email,
          name: admin.name,
          phone: admin.phone,
          role: admin.role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        results.push({
          email: admin.email,
          status: "created",
          uid: userRecord.uid,
        });
      } catch (error: any) {
        console.error(`Error creating admin ${admin.email}:`, error);
        results.push({
          email: admin.email,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Admin seeding completed",
      results,
    });
  } catch (error: any) {
    console.error("Error in seed-admins API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to seed admin users",
      },
      { status: 500 }
    );
  }
}
