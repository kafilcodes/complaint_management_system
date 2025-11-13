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
import { useAuth, useStore } from "@/lib/store";
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
  // Required fields - mobile, address, aadhar
  mobile: z
    .string()
    .length(10, "Mobile number must be exactly 10 digits")
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  address: z
    .string()
    .min(5, "Address is required (minimum 5 characters)")
    .max(500, "Address must be 500 characters or less"),
  aadhar: z
    .string()
    .length(12, "Aadhar number must be exactly 12 digits")
    .regex(/^\d{12}$/, "Aadhar must contain only digits"),
  // Optional field - alternate number
  alternateNo: z
    .string()
    .refine(
      (val) => !val || (val.length === 10 && /^[6-9]\d{9}$/.test(val)),
      "Must be a valid 10-digit mobile number if provided"
    )
    .optional()
    .or(z.literal("")),
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
    case "admin":
      return <Shield className="h-10 w-10" />;
    case "employee":
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
    admin: "Administrator",
    employee: "Employee",
  };
  return roleLabels[role] || role;
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function ProfilePage() {
  const { user } = useAuth();
  const setUser = useStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      mobile: user?.phone || "",
      address: (user as any)?.address || "",
      aadhar: (user as any)?.aadhar || "",
      alternateNo: (user as any)?.alternateNo || "",
    },
  });

  // Photo upload mutation - Direct Firebase Storage upload
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("[ProfilePage] 📸 Photo upload started", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      if (!user?.id) {
        console.error("[ProfilePage] ❌ No user ID for photo upload");
        throw new Error("User not authenticated");
      }

      console.log("[ProfilePage] 🔥 Importing Firebase modules...");
      // Import Firebase Storage dynamically
      const { storage } = await import("@/firebase/client");
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/firebase/client");

      console.log("[ProfilePage] ☁️ Uploading to Firebase Storage...");
      // Upload to Firebase Storage with user's required path structure
      const storagePath = `profile-photos/${user.id}/images/${file.name}`;
      console.log("[ProfilePage] Storage path:", storagePath);
      
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      console.log("[ProfilePage] ✅ Upload complete, getting download URL...");
      
      const photoURL = await getDownloadURL(snapshot.ref);
      console.log("[ProfilePage] 🔗 Photo URL:", photoURL);

      console.log("[ProfilePage] 📄 Updating Firestore document...");
      // Update Firestore user document with photoURL field
      const { Timestamp } = await import("firebase/firestore");
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { 
        photoURL: photoURL, // Standardized field name across all users
        updatedAt: Timestamp.now()
      });
      
      console.log("[ProfilePage] ✅ Firestore updated with new photo URL");
      return { photoURL };
    },
    onSuccess: (data) => {
      console.log("[ProfilePage] 🎉 Photo upload successful!", { photoURL: data.photoURL });
      
      // Update user in store with new photoURL
      if (user) {
        setUser({ ...user, photoURL: data.photoURL });
        console.log("[ProfilePage] 🔄 User store updated with new photo");
      }
      
      toast.success("Profile photo updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      console.error("[ProfilePage] ❌ Photo upload failed:", error);
      console.error("[ProfilePage] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast.error("Failed to upload photo", {
        description: error.message || "Please try again"
      });
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[ProfilePage] 📁 File selection triggered");
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log("[ProfilePage] ⚠️ No file selected");
      return;
    }
    
    console.log("[ProfilePage] 📋 File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2)
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("[ProfilePage] ❌ Invalid file type:", file.type);
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error("[ProfilePage] ❌ File too large:", (file.size / 1024 / 1024).toFixed(2), "MB");
      toast.error("Image must be less than 5MB");
      return;
    }

    console.log("[ProfilePage] ✅ Validation passed, starting upload...");
    uploadPhotoMutation.mutate(file);
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
    console.log("[ProfilePage] 📝 Form submission started", { data });
    
    try {
      if (!user?.id) {
        console.error("[ProfilePage] ❌ No user ID");
        throw new Error("User not authenticated");
      }

      console.log("[ProfilePage] 🔥 Importing Firestore modules...");
      // Import Firestore directly
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/firebase/client");

      console.log("[ProfilePage] 📄 Updating Firestore document:", user.id);
      
      // Update Firestore user document directly
      const { Timestamp } = await import("firebase/firestore");
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        phone: data.mobile,
        address: data.address,
        aadhar: data.aadhar,
        alternateNo: data.alternateNo || null,
        updatedAt: Timestamp.now(),
      });

      console.log("[ProfilePage] ✅ Firestore update successful");
      toast.success("Profile updated successfully");
      
      // Update user in store with new data
      setUser({ 
        ...user, 
        phone: data.mobile,
        address: data.address,
        aadhar: data.aadhar,
        alternateNo: data.alternateNo || null,
      } as any);
      
      console.log("[ProfilePage] 🔄 Invalidating queries");
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      
      console.log("[ProfilePage] 🎉 Profile update complete");
    } catch (error) {
      console.error("[ProfilePage] ❌ Profile update error:", error);
      console.error("[ProfilePage] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
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
                <AvatarImage 
                  src={user.photoURL || undefined} 
                  alt={user.name}
                  key={user.photoURL} // Force re-render when photoURL changes
                />
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
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                console.log("[ProfilePage] 🎯 Form submit event fired");
                console.log("[ProfilePage] Form state:", {
                  isDirty: form.formState.isDirty,
                  isValid: form.formState.isValid,
                  isSubmitting: form.formState.isSubmitting,
                  errors: form.formState.errors
                });
                form.handleSubmit(onSubmit)(e);
              }} 
              className="space-y-6"
            >
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
                          type="tel"
                          inputMode="numeric"
                          icon={Phone}
                          placeholder="9876543210"
                          maxLength={10}
                          {...field}
                          onChange={(e) => {
                            // Allow only numbers
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        10-digit mobile number
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
                        Alternate Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <IconInput 
                          type="tel"
                          inputMode="numeric"
                          icon={PhoneCall}
                          placeholder="8765432109"
                          maxLength={10}
                          {...field}
                          onChange={(e) => {
                            // Allow only numbers
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Secondary contact number (optional)
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
                        type="tel"
                        inputMode="numeric"
                        icon={CreditCard}
                        placeholder="123456789012"
                        maxLength={12}
                        {...field}
                        onChange={(e) => {
                          // Allow only numbers
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value);
                        }}
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
