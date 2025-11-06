/**
 * PROFILE PAGE
 * 
 * User profile page where users can view and edit their information.
 * 
 * @module app/(app)/profile/page
 */

"use client";

import { Moon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuth } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and settings
        </p>
      </div>

      {/* Theme Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription className="mt-1.5">
                Customize how the app looks on your device
              </CardDescription>
            </div>
            <ThemeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Switch between light and dark mode using the toggle above. Your preference is saved automatically.
          </p>
        </CardContent>
      </Card>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your account details and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Additional profile settings and edit functionality coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
