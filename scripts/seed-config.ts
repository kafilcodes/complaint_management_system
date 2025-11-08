/**
 * SEED FIRESTORE CONFIG SCRIPT
 * 
 * Seeds the Firestore config collection with brands and categories.
 * Run this once to populate the config/brands document.
 * 
 * Usage:
 *   npx tsx scripts/seed-config.ts
 * 
 * @module scripts/seed-config
 */

import { adminDb } from "../firebase/admin";
import { TICKET_BRANDS, TECHNICIAN_CATEGORIES } from "../configuration";

/**
 * Seed brands configuration
 */
async function seedBrands() {
  try {
    console.log("🔄 Seeding brands configuration...");
    
    // Convert string array to brand objects with value/label format
    const brandList = TICKET_BRANDS.map((brand) => ({
      value: brand.toLowerCase().replace(/\s+/g, "_").replace(/[()]/g, ""),
      label: brand,
    }));

    const brandsDocRef = adminDb.collection("config").doc("brands");
    
    await brandsDocRef.set({
      brandList,
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    console.log(`✅ Successfully seeded ${brandList.length} brands`);
    console.log("\nBrands seeded:");
    brandList.forEach((brand) => {
      console.log(`  - ${brand.label} (${brand.value})`);
    });
  } catch (error) {
    console.error("❌ Error seeding brands:", error);
    throw error;
  }
}

/**
 * Seed technician categories configuration
 */
async function seedCategories() {
  try {
    console.log("\n🔄 Seeding technician categories configuration...");
    
    const categoryList = TECHNICIAN_CATEGORIES.map((category) => ({
      value: category.toLowerCase().replace(/\s+/g, "_"),
      label: category,
    }));

    const categoriesDocRef = adminDb.collection("config").doc("categories");
    
    await categoriesDocRef.set({
      categoryList,
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    console.log(`✅ Successfully seeded ${categoryList.length} categories`);
    console.log("\nCategories seeded:");
    categoryList.forEach((category) => {
      console.log(`  - ${category.label} (${category.value})`);
    });
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seedConfig() {
  try {
    console.log("=" .repeat(60));
    console.log("  FIRESTORE CONFIG SEEDING SCRIPT");
    console.log("=" .repeat(60));
    console.log();

    await seedBrands();
    await seedCategories();

    console.log("\n" + "=" .repeat(60));
    console.log("  ✅ ALL CONFIG DATA SEEDED SUCCESSFULLY");
    console.log("=" .repeat(60));
    console.log();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seed script
seedConfig();
