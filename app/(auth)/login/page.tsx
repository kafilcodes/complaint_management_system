/**
 * LOGIN PAGE
 * 
 * Authentication page for users to sign in with email and password.
 * 
 * Features:
 * - Email/password form with validation (react-hook-form + zod)
 * - Firebase Authentication integration
 * - Error handling with toast notifications
 * - Loading states
 * - Auto-redirect to dashboard on successful login
 * - Redirects authenticated users away from login page
 * 
 * @module app/(auth)/login/page
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { auth } from "@/firebase/client";
import { useAuth } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/common/IconInput";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ==============================================================================
// VALIDATION SCHEMA
// ==============================================================================

/**
 * Login form validation schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ==============================================================================
// LOGIN PAGE COMPONENT
// ==============================================================================

/**
 * Login Page Component
 * 
 * Handles user authentication and redirects to dashboard on success.
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isAuthLoading, router]);

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Success toast
      toast.success("Login successful!", {
        description: `Welcome back, ${userCredential.user.email}`,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      // Handle Firebase Auth errors
      console.error("Login error:", error);

      let errorMessage = "Failed to sign in. Please try again.";

      // Provide user-friendly error messages
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please try again.";
      }

      toast.error("Login Failed", {
        description: errorMessage,
      });
    }
  };

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop: Two-column layout with graphic on left */}
      {/* Mobile: Single column stacked layout */}
      <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-8 lg:p-12 gap-8 md:gap-12">
        
        {/* Left Column: Graphic (hidden on mobile) - Reduced size by ~35% */}
        <div className="hidden md:flex md:flex-1 items-center justify-center">
          <div className="relative w-full max-w-sm aspect-square">
            <Image
              src="/sign_in.svg"
              alt="Sign in illustration"
              fill
              sizes="(max-width: 768px) 0px, 400px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          {/* Logo (visible on mobile above graphic, on desktop above form) - INCREASED SIZE */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 md:h-32 md:w-32">
              <Image
                src="/logo.png"
                alt="ServiceFirst Logo"
                fill
                sizes="(max-width: 768px) 96px, 128px"
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-center">
              {process.env.NEXT_PUBLIC_APP_NAME || "ServiceFirst"}
            </h1>
          </div>

          {/* Mobile Graphic (visible only on mobile) - Reduced by ~35% */}
          <div className="md:hidden mb-8 w-full max-w-[208px] mx-auto">
            <div className="relative w-full aspect-square">
              <Image
                src="/sign_in.svg"
                alt="Sign in illustration"
                fill
                sizes="208px"
                className="object-contain"
              />
            </div>
          </div>

          {/* Login Card */}
          <Card className="w-full border-0 shadow-none md:border md:shadow-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl md:text-2xl">
                Welcome Back
              </CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field with Icon */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <IconInput
                    id="email"
                    type="email"
                    icon={Mail}
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    autoFocus
                    disabled={isSubmitting}
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field with Icon and Show/Hide Toggle */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <IconInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    icon={Lock}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    {...register("password")}
                    className={errors.password ? "border-destructive" : ""}
                    rightElement={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    }
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button with Icon */}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Development Helper */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Development Mode: Use seeded admin credentials
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
