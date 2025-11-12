/**
 * VERIFY SEEDED USERS SCRIPT
 * 
 * This script verifies that all seeded users exist in both Firebase Auth
 * and Firestore with correct roles and data.
 * 
 * Usage:
 *   npm run verify:users
 * 
 * @module scripts/verify-users
 */

import * as admin from "firebase-admin";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const EXPECTED_USERS = [
  { email: "admin@gmail.com", role: "full_developer_admin", name: "Developer Admin" },
  { email: "admin@MParekh.com", role: "admin", name: "System Administrator" },
  { email: "john.employee@MParekh.com", role: "employee", name: "John Smith" },
  { email: "sarah.employee@MParekh.com", role: "employee", name: "Sarah Johnson" },
  { email: "mike.employee@MParekh.com", role: "employee", name: "Mike Davis" },
  { email: "lisa.employee@MParekh.com", role: "employee", name: "Lisa Martinez" },
];

// ==============================================================================
// FIREBASE ADMIN INITIALIZATION
// ==============================================================================

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountPath = path.resolve(
    process.cwd(),
    "context/complaint-management-pwa-firebase-adminsdk-fbsvc-671b3c28fa.json"
  );

  try {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    process.exit(1);
  }
}

// ==============================================================================
// VERIFICATION FUNCTIONS
// ==============================================================================

async function verifyUser(email: string, expectedRole: string, expectedName: string) {
  let authExists = false;
  let firestoreExists = false;
  let roleMatches = false;
  let uid: string | null = null;

  try {
    // Check Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      authExists = true;
      uid = userRecord.uid;

      // Check custom claims
      if (userRecord.customClaims?.role === expectedRole) {
        roleMatches = true;
      }

      console.log(`  ✅ Auth: Found (${userRecord.uid})`);
      console.log(`  ✅ Custom Claims: ${userRecord.customClaims?.role || "none"} ${roleMatches ? "✓" : "✗"}`);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        console.log(`  ❌ Auth: Not found`);
      } else {
        throw error;
      }
    }

    // Check Firestore
    if (uid) {
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(uid).get();

      if (userDoc.exists) {
        firestoreExists = true;
        const userData = userDoc.data();
        console.log(`  ✅ Firestore: Found`);
        console.log(`  ✅ Name: ${userData?.name}`);
        console.log(`  ✅ Role: ${userData?.role}`);
        console.log(`  ✅ Status: ${userData?.status}`);
        console.log(`  ✅ Department: ${userData?.department || "N/A"}`);
      } else {
        console.log(`  ❌ Firestore: Not found`);
      }
    }

    return {
      email,
      authExists,
      firestoreExists,
      roleMatches,
      success: authExists && firestoreExists && roleMatches,
    };
  } catch (error) {
    console.log(`  ❌ Error verifying user: ${error}`);
    return {
      email,
      authExists: false,
      firestoreExists: false,
      roleMatches: false,
      success: false,
    };
  }
}

// ==============================================================================
// MAIN EXECUTION
// ==============================================================================

async function verifyUsers() {
  console.log("🔍 Starting user verification...\n");
  console.log("=".repeat(80));

  // Initialize Firebase
  initializeFirebase();

  const results = [];

  for (const user of EXPECTED_USERS) {
    console.log(`\n📧 Verifying: ${user.email}`);
    console.log("-".repeat(80));

    const result = await verifyUser(user.email, user.role, user.name);
    results.push(result);
  }

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 VERIFICATION SUMMARY\n");

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log(`Total users checked: ${results.length}`);
  console.log(`✅ Fully verified: ${successCount}`);
  console.log(`❌ Missing or incomplete: ${failCount}`);

  if (failCount > 0) {
    console.log("\n⚠️  Some users are missing or incomplete. Run 'npm run seed:users' to create them.");
  } else {
    console.log("\n✅ All users are properly configured!");
  }

  // Print detailed results
  console.log("\n" + "=".repeat(80));
  console.log("\n📋 DETAILED RESULTS\n");
  console.log("=".repeat(80));
  console.log(
    String.prototype.padEnd.call("Email", 40) +
    String.prototype.padEnd.call("Auth", 10) +
    String.prototype.padEnd.call("Firestore", 15) +
    String.prototype.padEnd.call("Role", 10) +
    "Status"
  );
  console.log("=".repeat(80));

  results.forEach((result) => {
    const status = result.success ? "✅ OK" : "❌ FAIL";
    console.log(
      String.prototype.padEnd.call(result.email, 40) +
      String.prototype.padEnd.call(result.authExists ? "✅" : "❌", 10) +
      String.prototype.padEnd.call(result.firestoreExists ? "✅" : "❌", 15) +
      String.prototype.padEnd.call(result.roleMatches ? "✅" : "❌", 10) +
      status
    );
  });

  console.log("=".repeat(80));
  console.log("\n✅ Verification completed!\n");

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the verification
verifyUsers().catch((error) => {
  console.error("\n❌ Fatal error during verification:", error);
  process.exit(1);
});
