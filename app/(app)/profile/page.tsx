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
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  PhoneCall,
  Camera
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
import { apiGet } from "@/lib/api-client";
import type { UserRole } from "@/lib/types";

// ==============================================================================
// VALIDATION SCHEMA
// ==============================================================================

const profileFormSchema = z.object({
  // Mutable fields (user can edit) - NOW REQUIRED
  mobile: z
    .string()
    .min(10, "Mobile number is required")
    .max(13, "Mobile number must not exceed 13 characters")
    .refine(
      (val) => /^(\+91)?[6-9]\d{9}$/.test(val),
      "Must be a valid 10-digit Indian mobile number (e.g., 9876543210 or +919876543210)"
    ),
  address: z
    .string()
    .min(5, "Address is required")
    .max(100, "Address must be 100 characters or less"),
  aadhar: z
    .string()
    .length(12, "Aadhar number must be exactly 12 digits")
    .refine(
      (val) => /^\d{12}$/.test(val),
      "Aadhar must contain only digits"
    ),
  alternateNo: z
    .string()
    .min(10, "Alternate number is required")
    .max(13, "Mobile number must not exceed 13 characters")
    .refine(
      (val) => /^(\+91)?[6-9]\d{9}$/.test(val),
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
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      mobile: user?.phone || "",
      address: "",
      aadhar: "",
      alternateNo: "",
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/users/profile-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload photo");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update user in store with new photoURL
      if (user) {
        setUser({ ...user, photoURL: data.data.photoURL });
      }
      toast.success("Profile photo updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to upload photo", {
        description: error.message,
      });
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      uploadPhotoMutation.mutate(file);
    }
  };

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
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload button overlay */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                type="button"
              >
                {uploadPhotoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
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
                      <FormLabel>
                        Mobile Number (WhatsApp) <span className="text-destructive">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Alternate Number <span className="text-destructive">*</span>
                      </FormLabel>
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
                    <FormLabel>
                      Address <span className="text-destructive">*</span>
                    </FormLabel>
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
                    <FormLabel>
                      Aadhar Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <IconInput 
                        icon={CreditCard}
                        placeholder="123456789012"
                        maxLength={12}
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
                  disabled={form.formState.isSubmitting || !form.formState.isDirty || !form.formState.isValid}
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
