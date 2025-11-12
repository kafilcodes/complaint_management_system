/**
 * API Route: POST /api/users/profile-photo
 * 
 * Upload profile photo to Firebase Storage and update user document
 * 
 * @module api/users/profile-photo
 * @note PUBLIC ROUTE - This is an internal-only app with no auth required
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/firebase/admin";

/**
 * POST /api/users/profile-photo
 * Upload user profile photo
 * 
 * Body: FormData with 'photo' field containing the image file AND 'userId' field
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data - get both userId and photo
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const photo = formData.get("photo") as File;
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

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
    const fileName = `profile-photos/${userId}/profile.jpg`;
    const file = bucket.file(fileName);

    // Save file with proper metadata including cache control
    await file.save(buffer, {
      metadata: {
        contentType: photo.type,
        cacheControl: "public, max-age=31536000", // Cache for 1 year
      },
      public: true, // Make file public during upload
    });

    // Explicitly make the file publicly accessible
    await file.makePublic();

    // Get the public URL - Use firebasestorage.googleapis.com for proper CORS
    const photoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

    // Update user document in Firestore
    await adminDb.collection("users").doc(userId).update({
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
