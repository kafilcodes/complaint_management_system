/**
 * PROFILE PAGE
 * 
 * User profile page where users can view and edit their information.
 * 
 * @module app/(app)/profile/page
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile settings",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and settings
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">Profile settings coming soon...</p>
      </div>
    </div>
  );
}
