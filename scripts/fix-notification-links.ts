/**
 * FIX NOTIFICATION LINKS
 * 
 * This script adds missing `link` fields to existing notifications in Firestore.
 * Notifications should have a link to the related ticket details page.
 * 
 * Run with: npx tsx scripts/fix-notification-links.ts
 */

import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing required Firebase credentials in environment variables");
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function fixNotificationLinks() {
  console.log("🔍 Starting notification links fix...\n");

  try {
    // Get all notifications
    const notificationsSnapshot = await db.collection("notifications").get();
    console.log(`📦 Found ${notificationsSnapshot.size} total notifications\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    const batch = db.batch();

    for (const doc of notificationsSnapshot.docs) {
      const data = doc.data();
      
      // Skip if already has a link
      if (data.link) {
        skippedCount++;
        continue;
      }

      // Skip if no ticketId
      if (!data.ticketId) {
        console.log(`⚠️  Notification ${doc.id} has no ticketId, skipping`);
        skippedCount++;
        continue;
      }

      // Add link field
      const link = `/complaints/${data.ticketId}`;
      batch.update(doc.ref, { link });
      
      console.log(`✅ Fixed notification ${doc.id} - Added link: ${link}`);
      fixedCount++;
    }

    // Commit the batch
    if (fixedCount > 0) {
      await batch.commit();
      console.log(`\n✨ Successfully fixed ${fixedCount} notifications`);
    } else {
      console.log("\n✨ No notifications needed fixing");
    }
    
    console.log(`📊 Skipped ${skippedCount} notifications (already had links or no ticketId)\n`);
    
  } catch (error) {
    console.error("❌ Error fixing notification links:", error);
    throw error;
  }
}

// Run the script
fixNotificationLinks()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
