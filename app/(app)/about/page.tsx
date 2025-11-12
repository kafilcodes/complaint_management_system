"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  Info,
  Wrench,
  Users,
  TrendingUp,
  Shield,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function AboutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsSubmitting(true);
    
    try {
      // Simulate sending message (you can integrate with email service later)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log("Contact form submitted:", values);
      
      setIsSuccess(true);
      toast.success("Message sent successfully!", {
        description: "We'll get back to you as soon as possible.",
      });
      
      form.reset();
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again or contact us directly via email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">About Us</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Learn more about our complaint management system and get in touch
        </p>
      </div>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            About MParekh Complaint Management
          </CardTitle>
          <CardDescription>
            Our mission is to streamline complaint resolution and improve customer satisfaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm sm:text-base leading-relaxed">
            MParekh Complaint Management System is a comprehensive solution designed to help
            businesses efficiently manage and resolve customer complaints. Our platform provides
            a seamless experience for both employees and administrators to track, manage, and
            resolve issues in a timely manner.
          </p>
          <p className="text-sm sm:text-base leading-relaxed">
            With powerful features like ticket tracking, assignment management, real-time
            notifications, and detailed reporting, we empower teams to deliver exceptional
            customer service and maintain high satisfaction levels.
          </p>
        </CardContent>
      </Card>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Ticket Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Create, track, and manage customer complaints with ease. Assign tickets to
                technicians, track progress, and ensure timely resolution with our intuitive
                ticket management system.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Analytics & Reporting
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Get comprehensive insights with detailed reports and analytics. Track performance
                metrics, identify trends, and make data-driven decisions to improve your support
                operations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Role-Based Access
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Secure role-based access control ensures that each user has appropriate
                permissions. Admins can manage the entire system while employees can focus on
                their assigned tasks.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Real-Time Updates
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Stay informed with real-time notifications and timeline tracking. Monitor ticket
                status changes, assignments, and resolutions as they happen with our live update
                system.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card id="contact">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Us
          </CardTitle>
          <CardDescription>
            Have questions or feedback? We'd love to hear from you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30">
              <div className="rounded-full bg-primary/10 p-2">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                <a
                  href="mailto:mparekhenterprises@gmail.com"
                  className="text-sm font-semibold hover:text-primary transition-colors truncate block"
                >
                  mparekhenterprises@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30">
              <div className="rounded-full bg-primary/10 p-2">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Phone</p>
                <a
                  href="tel:+911234567890"
                  className="text-sm font-semibold hover:text-primary transition-colors"
                >
                  +91 123 456 7890
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30 sm:col-span-2">
              <div className="rounded-full bg-primary/10 p-2">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Address</p>
                <p className="text-sm font-semibold">
                  Jagdalpur, Bastar District<br />
                  Chhattisgarh - 494001
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="What is this about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us more..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <p className="text-xs sm:text-sm text-center text-muted-foreground">
            💡 <strong>Tip:</strong> For urgent issues, please call our support line directly.
            We're here to help!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
