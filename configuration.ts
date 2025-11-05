/*
 * PROJECT CONFIGURATION
 *
 * This file stores all static configuration data for the application.
 * By centralizing this data, we avoid hardcoding values in components,
 * prevent unnecessary database reads, and make future updates easy.
 *
 * All static dropdowns, lists, and settings should be defined here.
 */

// Brands for the "Create Ticket" form dropdown
export const TICKET_BRANDS: string[] = [
  "Anchor",
  "Polycop",
  "Pigeon",
  "Hindwer",
  "Remi",
  "Khatan",
  "Blowhod",
  "Tandam (vishal maga mart)",
  "Reliance Res",
  "Butterfly",
  "Infrared marking (ivas)",
  "Philips",
  "Suryfalm",
  "Sunflam",
  "Ottomate",
  "U cock",
];

// Categories for Technicians
export const TECHNICIAN_CATEGORIES: string[] = [
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
