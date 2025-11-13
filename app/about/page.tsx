"use client";

import type { Metadata } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Users,
  TrendingUp,
  Clock,
  ArrowLeft,
} from "lucide-react";

/**
 * About Page Component
 * 
 * Features:
 * - Mobile-first responsive design
 * - Adaptive typography and spacing
 * - SEO-optimized content
 * - Modern minimal layout
 * - Accessible contact information
 * - Back navigation button
 */
export default function AboutPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Back Button */}
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      {/* Hero Section */}
      <section className="mb-8 sm:mb-12 lg:mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              About Us
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
              Streamlining complaint resolution and improving customer satisfaction through innovative technology
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {process.env.NEXT_PUBLIC_APP_NAME || "MParekh"} Complaint Management System is a comprehensive solution designed to help
              businesses efficiently manage and resolve customer complaints with powerful features
              and real-time tracking.
            </p>
          </div>

          {/* Illustration */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="w-full max-w-md lg:max-w-lg">
              <Image
                src="/about.svg"
                alt="About MParekh Complaint Management System"
                width={600}
                height={465}
                priority
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-8 sm:mb-12 lg:mb-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 lg:mb-10 text-center">
          Why Choose Us
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Feature 1 */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="rounded-full bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Team Management
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Assign complaints to technicians and track team performance efficiently
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="rounded-full bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Analytics & Reports
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Get comprehensive insights with detailed reports and data visualization
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="rounded-full bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-3 sm:mb-4">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Secure Access
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Role-based permissions ensure data security and appropriate access
            </p>
          </Card>

          {/* Feature 4 */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="rounded-full bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-3 sm:mb-4">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Real-Time Updates
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Monitor complaint status changes and resolutions as they happen
            </p>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center">
          Get In Touch
        </h2>
        <Card className="p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Email */}
            <a
              href="mailto:mparekhenterprises@gmail.com"
              className="flex items-start gap-4 p-4 sm:p-5 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all duration-300 group"
            >
              <div className="rounded-full bg-primary/10 group-hover:bg-primary/20 p-3 transition-colors">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Email Us
                </p>
                <p className="text-sm sm:text-base font-semibold truncate group-hover:text-primary transition-colors">
                  mparekhenterprises@gmail.com
                </p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+911234567890"
              className="flex items-start gap-4 p-4 sm:p-5 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all duration-300 group"
            >
              <div className="rounded-full bg-primary/10 group-hover:bg-primary/20 p-3 transition-colors">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Call Us
                </p>
                <p className="text-sm sm:text-base font-semibold group-hover:text-primary transition-colors">
                  +91 123 456 7890
                </p>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-start gap-4 p-4 sm:p-5 rounded-lg border border-border sm:col-span-2 lg:col-span-1">
              <div className="rounded-full bg-primary/10 p-3">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Visit Us
                </p>
                <p className="text-sm sm:text-base font-semibold leading-relaxed">
                  Jagdalpur, Bastar District
                  <br />
                  Chhattisgarh - 494001
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer Note */}
      <section>
        <Card className="bg-muted/30 border-dashed p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-center text-muted-foreground">
            <strong className="text-foreground">Need Help?</strong> Our support team is available to assist you with any questions or concerns.
          </p>
        </Card>
      </section>
    </div>
  );
}
