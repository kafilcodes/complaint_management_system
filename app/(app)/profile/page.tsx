/**
 * PROFILE PAGE (Production-Level)
 * 
 * User profile page with:
 * - Avatar with role-based icon fallbacks
 * - React Hook Form for validation
 * - Mutable fields (mobile, address, aadhar, alternateNo)
 * - Immutable fields (name, email, role, uid)
 * - API integration for profile updates
 * 
 * @module app/(app)/profile/page
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Moon, 
  Shield, 
  Wrench, 
  User as UserIcon, 
  Loader2, 
  Save,
  Phone,
  MapPin,
  CreditCard,
  PhoneCall
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { IconInput } from "@/components/common/IconInput";
import { useAuth } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";

// ==============================================================================
// VALIDATION SCHEMA
// ==============================================================================

const profileFormSchema = z.object({
  // Mutable fields (user can edit)
  mobile: z
    .string()
    .max(13, "Mobile number must not exceed 13 characters")
    .optional()
    .refine(
      (val) => !val || /^(\+91)?[6-9]\d{9}$/.test(val),
      "Must be a valid 10-digit Indian mobile number (e.g., 9876543210 or +919876543210)"
    ),
  address: z
    .string()
    .max(100, "Address must be 100 characters or less")
    .optional(),
  aadhar: z
    .string()
    .max(12, "Aadhar number must be 12 digits")
    .optional(),
  alternateNo: z
    .string()
    .max(13, "Mobile number must not exceed 13 characters")
    .optional()
    .refine(
      (val) => !val || /^(\+91)?[6-9]\d{9}$/.test(val),
      "Must be a valid 10-digit Indian mobile number"
    ),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Get icon component based on user role
 */
function getRoleIcon(role: UserRole): React.ReactElement {
  switch (role) {
    case "full_developer_admin":
    case "it_admin":
      return <Shield className="h-10 w-10" />;
    case "it_technician":
      return <Wrench className="h-10 w-10" />;
    default:
      return <UserIcon className="h-10 w-10" />;
  }
}

/**
 * Get human-readable role label
 */
function getRoleLabel(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    full_developer_admin: "Full Developer Admin",
    it_admin: "IT Administrator",
    it_technician: "IT Technician",
    store_manager: "Store Manager",
    store_employee: "Store Employee",
  };
  return roleLabels[role] || role;
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function ProfilePage() {
  const { user } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      mobile: user?.phone || "",
      address: "",
      aadhar: "",
      alternateNo: "",
    },
  });

  // Early return if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // TODO: Call /api/users/profile endpoint
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and settings
        </p>
      </div>

      {/* Theme Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Appearance</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Customize how the application looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </div>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Account Information</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Your account details and system role (read-only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {/* TODO: Add profileImageUrl support when implemented */}
              <AvatarImage src={undefined} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-2xl font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  {getRoleIcon(user.role)}
                  <span className="ml-1">{getRoleLabel(user.role)}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Immutable Fields (Display Only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <Input value={user.id} disabled className="bg-muted" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <Input value={getRoleLabel(user.role)} disabled className="bg-muted" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Full Name
              </label>
              <Input value={user.name} disabled className="bg-muted" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your contact details and additional information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number (WhatsApp)</FormLabel>
                      <FormControl>
                        <IconInput 
                          icon={Phone}
                          placeholder="+91 98765 43210"
                          maxLength={13}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Your primary contact number (10 digits)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alternateNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Number (Optional)</FormLabel>
                      <FormControl>
                        <IconInput 
                          icon={PhoneCall}
                          placeholder="+91 87654 32109"
                          maxLength={13}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Secondary contact number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Street, City, State, PIN Code"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Your current residential address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aadhar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aadhar Number (Optional)</FormLabel>
                    <FormControl>
                      <IconInput 
                        icon={CreditCard}
                        placeholder="1234 5678 9012"
                        maxLength={14}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Your 12-digit Aadhar card number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={form.formState.isSubmitting || !form.formState.isDirty}
                >
                  Reset Changes
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting || !form.formState.isDirty}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {!form.formState.isSubmitting && (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
