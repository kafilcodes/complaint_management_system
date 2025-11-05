/**
 * USER SEED SCRIPT
 * 
 * This script creates pre-seeded test accounts in Firebase Auth and Firestore.
 * It uses the Firebase Admin SDK to create users with custom claims and proper
 * role-based data in Firestore.
 * 
 * Usage:
 *   npm run seed:users
 * 
 * @module scripts/seed-users
 */

import * as admin from "firebase-admin";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ==============================================================================
// CONFIGURATION
// ==============================================================================

/**
 * Test user accounts to be created
 */
const SEED_USERS = [
  {
    email: "admin@gmail.com",
    password: "admin@99999",
    name: "Developer Admin",
    role: "full_developer_admin" as const,
    phone: "+1234567890",
    department: "Engineering",
    employeeId: "DEV001",
  },
  {
    email: "admin@servicefirst.com",
    password: "admin@12345",
    name: "System Administrator",
    role: "admin" as const,
    phone: "+1234567891",
    department: "Administration",
    employeeId: "ADM001",
  },
  {
    email: "john.employee@servicefirst.com",
    password: "employee@123",
    name: "John Smith",
    role: "employee" as const,
    phone: "+1234567892",
    department: "Customer Service",
    employeeId: "EMP001",
  },
  {
    email: "sarah.employee@servicefirst.com",
    password: "employee@123",
    name: "Sarah Johnson",
    role: "employee" as const,
    phone: "+1234567893",
    department: "Technical Support",
    employeeId: "EMP002",
  },
  {
    email: "mike.employee@servicefirst.com",
    password: "employee@123",
    name: "Mike Davis",
    role: "employee" as const,
    phone: "+1234567894",
    department: "Maintenance",
    employeeId: "EMP003",
  },
  {
    email: "lisa.employee@servicefirst.com",
    password: "employee@123",
    name: "Lisa Martinez",
    role: "employee" as const,
    phone: "+1234567895",
    department: "Customer Service",
    employeeId: "EMP004",
  },
];

// ==============================================================================
// FIREBASE ADMIN INITIALIZATION
// ==============================================================================

/**
 * Initialize Firebase Admin SDK
 */
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
// USER CREATION FUNCTIONS
// ==============================================================================

/**
 * Create a user in Firebase Auth
 */
async function createAuthUser(userData: typeof SEED_USERS[0]) {
  try {
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(userData.email);
      console.log(`ℹ️  User already exists in Auth: ${userData.email} (${existingUser.uid})`);
      return existingUser.uid;
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
      // User doesn't exist, continue with creation
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
      emailVerified: true, // Auto-verify for test accounts
    });

    console.log(`✅ Created Auth user: ${userData.email} (${userRecord.uid})`);

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: userData.role,
    });

    console.log(`✅ Set custom claims: role=${userData.role}`);

    return userRecord.uid;
  } catch (error) {
    console.error(`❌ Failed to create Auth user ${userData.email}:`, error);
    throw error;
  }
}

/**
 * Create a user document in Firestore
 */
async function createFirestoreUser(uid: string, userData: typeof SEED_USERS[0]) {
  try {
    const db = admin.firestore();

    // Check if user already exists
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      console.log(`ℹ️  User already exists in Firestore: ${userData.email}`);
      return;
    }

    // Create user document
    const userDocData = {
      uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone || null,
      department: userData.department || null,
      employeeId: userData.employeeId || null,
      status: "active" as const,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "system",
      lastLoginAt: null,
      profilePicture: null,
      preferences: {
        notifications: true,
        emailNotifications: true,
        theme: "light",
      },
      metadata: {
        isSeeded: true,
        seedDate: new Date().toISOString(),
      },
    };

    await db.collection("users").doc(uid).set(userDocData);

    console.log(`✅ Created Firestore user document: ${userData.email}`);
  } catch (error) {
    console.error(`❌ Failed to create Firestore user ${userData.email}:`, error);
    throw error;
  }
}

/**
 * Create a single user (Auth + Firestore)
 */
async function createUser(userData: typeof SEED_USERS[0]) {
  console.log(`\n📝 Creating user: ${userData.name} (${userData.email})`);

  try {
    // Create in Firebase Auth
    const uid = await createAuthUser(userData);

    // Create in Firestore
    await createFirestoreUser(uid, userData);

    console.log(`✅ User created successfully: ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create user ${userData.email}:`, error);
    return false;
  }
}

// ==============================================================================
// MAIN EXECUTION
// ==============================================================================

/**
 * Main function to seed all users
 */
async function seedUsers() {
  console.log("🌱 Starting user seeding process...\n");
  console.log("=" .repeat(80));

  // Initialize Firebase
  initializeFirebase();

  // Create all users
  let successCount = 0;
  let failCount = 0;

  for (const userData of SEED_USERS) {
    const success = await createUser(userData);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 SEEDING SUMMARY\n");
  console.log(`Total users: ${SEED_USERS.length}`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  // Print credentials table
  console.log("\n" + "=".repeat(80));
  console.log("\n🔐 TEST ACCOUNT CREDENTIALS\n");
  console.log("=" .repeat(80));
  console.log(
    String.prototype.padEnd.call("Email", 40) +
    String.prototype.padEnd.call("Password", 20) +
    String.prototype.padEnd.call("Role", 25) +
    "Name"
  );
  console.log("=".repeat(80));

  SEED_USERS.forEach((user) => {
    console.log(
      String.prototype.padEnd.call(user.email, 40) +
      String.prototype.padEnd.call(user.password, 20) +
      String.prototype.padEnd.call(user.role, 25) +
      user.name
    );
  });

  console.log("=".repeat(80));
  console.log("\n✅ Seeding process completed!\n");

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the seeding process
seedUsers().catch((error) => {
  console.error("\n❌ Fatal error during seeding:", error);
  process.exit(1);
});
