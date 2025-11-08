/**
 * USER PROFILE UPDATE API ROUTE
 * 
 * Allows authenticated users to update their own profile information.
 * Users can only update specific mutable fields (mobile, address, aadhar, alternateNo).
 * 
 * @route PUT /api/users/profile
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { z } from "zod";

// ==============================================================================
// VALIDATION SCHEMA
// ==============================================================================

const profileUpdateSchema = z.object({
  mobile: z.string().optional(),
  address: z.string().optional(),
  aadhar: z.string().optional(),
  alternateNo: z.string().optional(),
});

// ==============================================================================
// PUT HANDLER
// ==============================================================================

export async function PUT(request: NextRequest) {
  try {
    // ============================================================================
    // 1. AUTHENTICATION
    // ============================================================================
    
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // ============================================================================
    // 2. VALIDATE REQUEST BODY
    // ============================================================================

    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // ============================================================================
    // 3. UPDATE USER PROFILE IN FIRESTORE
    // ============================================================================

    const userDocRef = adminDb.collection("users").doc(userId);
    
    // Check if user exists
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // Update only the fields provided
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.mobile !== undefined) updateData.mobile = updates.mobile;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.aadhar !== undefined) updateData.aadhar = updates.aadhar;
    if (updates.alternateNo !== undefined) updateData.alternateNo = updates.alternateNo;

    await userDocRef.update(updateData);

    // ============================================================================
    // 4. RETURN SUCCESS
    // ============================================================================

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId,
        updatedFields: Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined),
      },
    });

  } catch (error) {
    console.error("[PUT /api/users/profile] Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
