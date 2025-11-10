import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id]
 * Get a single user by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Fetch user from Firestore
    const userDoc = await adminDb.collection("users").doc(id).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch auth user data
    const authUser = await adminAuth.getUser(id);

    return NextResponse.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data(),
        disabled: authUser.disabled,
        lastLogin: authUser.metadata.lastSignInTime || undefined,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update a user (admin only)
 * 
 * Body: { email?, name?, role?, phone?, isActive?, mobile?, address?, aadhar?, alternateNo? }
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Parse request body
    const body = await request.json();
    const { 
      email, 
      name, 
      role, 
      phone, 
      isActive,
      mobile,
      address,
      aadhar,
      alternateNo
    } = body;

    // Validate role if provided
    if (role) {
      const validRoles = ["user", "it_technician", "it_admin", "full_developer_admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
      );
      }
    }

    // Update Firebase Auth user
    const authUpdates: any = {};
    if (email) authUpdates.email = email;
    if (name) authUpdates.displayName = name;
    if (typeof isActive === "boolean") authUpdates.disabled = !isActive;

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(id, authUpdates);
    }

    // Update custom claims if role changed
    if (role) {
      await adminAuth.setCustomUserClaims(id, { role });
    }

    // Update Firestore user document
    const firestoreUpdates: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (email) firestoreUpdates.email = email;
    if (name) firestoreUpdates.name = name;
    if (role) firestoreUpdates.role = role;
    if (phone !== undefined) firestoreUpdates.phone = phone || null;
    if (typeof isActive === "boolean") firestoreUpdates.isActive = isActive;
    if (mobile !== undefined) firestoreUpdates.mobile = mobile || null;
    if (address !== undefined) firestoreUpdates.address = address || null;
    if (aadhar !== undefined) firestoreUpdates.aadhar = aadhar || null;
    if (alternateNo !== undefined) firestoreUpdates.alternateNo = alternateNo || null;

    await adminDb.collection("users").doc(id).update(firestoreUpdates);

    // Fetch updated user
    const updatedUserDoc = await adminDb.collection("users").doc(id).get();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: updatedUserDoc.id,
        ...updatedUserDoc.data(),
      },
    });
  } catch (error: any) {
    console.error("Error updating user:", error);

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

    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user from both Firebase Auth and Firestore (admin only)
 * 
 * Query params:
 * - reassign: user ID to reassign tickets to (optional)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Get reassign parameter
    const { searchParams } = new URL(request.url);
    const reassignTo = searchParams.get("reassign");

    // Fetch user to be deleted
    const userDoc = await adminDb.collection("users").doc(id).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Handle ticket reassignment if user is a technician
    if (userData?.role === "it_technician" || userData?.role === "it_admin") {
      const assignedTickets = await adminDb
        .collection("tickets")
        .where("assignedTo", "==", id)
        .get();

      if (!assignedTickets.empty) {
        if (reassignTo) {
          // Verify reassign target exists and is a technician
          const reassignUserDoc = await adminDb.collection("users").doc(reassignTo).get();
          
          if (!reassignUserDoc.exists) {
            return NextResponse.json(
              { error: "Reassign target user not found" },
              { status: 400 }
            );
          }

          const reassignUserData = reassignUserDoc.data();
          if (
            reassignUserData?.role !== "it_technician" &&
            reassignUserData?.role !== "it_admin" &&
            reassignUserData?.role !== "full_developer_admin"
          ) {
            return NextResponse.json(
              { error: "Reassign target must be a technician or admin" },
              { status: 400 }
            );
          }

          // Reassign tickets
          const batch = adminDb.batch();
          assignedTickets.docs.forEach((doc) => {
            batch.update(doc.ref, {
              assignedTo: reassignTo,
              assignedToName: reassignUserData?.name || "Unknown",
              updatedAt: new Date().toISOString(),
            });
          });
          await batch.commit();
        } else {
          // Unassign tickets (set to null)
          const batch = adminDb.batch();
          assignedTickets.docs.forEach((doc) => {
            batch.update(doc.ref, {
              assignedTo: null,
              assignedToName: null,
              updatedAt: new Date().toISOString(),
            });
          });
          await batch.commit();
        }
      }
    }

    // Handle tickets created by user (if user role)
    if (userData?.role === "user") {
      const createdTickets = await adminDb
        .collection("tickets")
        .where("createdBy", "==", id)
        .get();

      if (!createdTickets.empty) {
        // Update created tickets to mark user as deleted
        const batch = adminDb.batch();
        createdTickets.docs.forEach((doc) => {
          batch.update(doc.ref, {
            createdByDeleted: true,
            updatedAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      }
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(id);

    // Delete from Firestore
    await adminDb.collection("users").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "User deleted successfully from both Auth and Firestore",
      data: {
        id,
        ticketsReassigned: reassignTo ? true : false,
      },
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);

    if (error.code === "auth/user-not-found") {
      // If auth user not found but Firestore exists, delete Firestore doc
      try {
        await adminDb.collection("users").doc(context.params.id).delete();
        return NextResponse.json({
          success: true,
          message: "User deleted from Firestore (Auth record not found)",
        });
      } catch (firestoreError) {
        console.error("Error deleting from Firestore:", firestoreError);
      }
    }

    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
