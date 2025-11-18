/*
 * PROJECT CONFIGURATION
 *
 * This file stores all static configuration data for the application.
 * By centralizing this data, we avoid hardcoding values in components,
 * prevent unnecessary database reads, and make future updates easy.
 *
 * All static dropdowns, lists, and settings should be defined here.
 */

// Brands for the "Create Complaint" form dropdown
export const TICKET_BRANDS: string[] = [
  "Anchor",
  "Polycop",
  "Pigeon",
  "Hindware",
  "Remi",
  "Khaitan",
  "Blowhood",
  "Tandam (Vishal Mega Mart)",
  "Reliance",
  "Butterfly",
  "Infrared Marking (IVAS)",
  "Philips",
  "Sunflame",
  "Ottomate",
  "U-Cook",
];

// Categories for Technicians (including Administration for admin roles)
export const TECHNICIAN_CATEGORIES: string[] = [
  "Administration",
  "IT Support",
  "Desktop Support",
  "Technical Support",
  "Service Desk",
  "Field Technician",
  "Appliance Repair",
  "General Maintenance",
];

// Other configuration...
export const APP_CONFIG = {
  defaultLocale: "en",
  // Add other global settings here
};
