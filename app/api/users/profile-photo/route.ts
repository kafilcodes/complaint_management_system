/**
 * API Route: POST /api/users/profile-photo
 * 
 * Upload profile photo to Firebase Storage and update user document
 * 
 * @module api/users/profile-photo
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/firebase/admin";
import { verifyAuth } from "@/lib/auth";

/**
 * POST /api/users/profile-photo
 * Upload user profile photo
 * 
 * Body: FormData with 'photo' field containing the image file
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await verifyAuth(request);
    if (!authenticated || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File;

    if (!photo) {
      return NextResponse.json(
        { error: "No photo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileName = `profile-photos/${user.id}/profile.jpg`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: photo.type,
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update user document in Firestore
    await adminDb.collection("users").doc(user.id).update({
      photoURL,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: {
        photoURL,
      },
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload profile photo" },
      { status: 500 }
    );
  }
}
