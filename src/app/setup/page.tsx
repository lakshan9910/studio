
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { allPermissions } from "@/types/permissions";
import { Step, Stepper, useStepper } from "@/components/ui/stepper";
import { Store } from "lucide-react";

const adminUserSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const storeSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required."),
  currency: z.string().length(3, "Currency code must be 3 characters."),
});

type AdminUserFormValues = z.infer<typeof adminUserSchema>;
type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

const steps = [
  { label: "Create Admin Account" },
  { label: "Configure Store" },
  { label: "Finish" },
];

function AdminStep() {
  const { addUser, hasUsers } = useAuth();
  const { nextStep } = useStepper();
  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: AdminUserFormValues) => {
    try {
      if (!hasUsers()) {
        await addUser(data.name, data.email, data.password, undefined, undefined, allPermissions);
      }
      nextStep();
    } catch (error: any) {
      form.setError("root", { message: error.message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Admin User" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Admin"}
        </Button>
      </form>
    </Form>
  );
}

function StoreStep() {
  const { settings, updateSettings } = useSettings();
  const { nextStep } = useStepper();
  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: { storeName: settings.storeName, currency: settings.currency },
  });

  const onSubmit = (data: StoreSettingsFormValues) => {
    updateSettings(data);
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="storeName" render={({ field }) => (
          <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input placeholder="My Awesome Store" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="currency" render={({ field }) => (
          <FormItem><FormLabel>Currency Code</FormLabel><FormControl><Input placeholder="USD" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" className="w-full">Save and Continue</Button>
      </form>
    </Form>
  );
}

function FinishStep() {
    const { updateSettings } = useSettings();
    const router = useRouter();

    const handleFinish = () => {
        updateSettings({ isSetupComplete: true });
        router.push('/login');
    }
    
    return (
        <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Setup Complete!</h3>
            <p className="text-muted-foreground">Your POS system is now configured. You can now proceed to the login page.</p>
            <Button onClick={handleFinish} className="w-full">Go to Login</Button>
        </div>
    )
}

export default function SetupPage() {
  const { settings, loading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (!loading && settings.isSetupComplete) {
      router.replace('/login');
    }
  }, [settings, loading, router]);
  
  if (loading || settings.isSetupComplete) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-lg p-4">
        <div className="flex justify-center items-center gap-3 mb-6">
            <Store className="h-8 w-8 text-primary"/>
            <h1 className="text-3xl font-bold">Welcome to SOLO POS</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>First-Time Setup</CardTitle>
            <CardDescription>Let's get your store configured. This will only run once.</CardDescription>
          </CardHeader>
          <CardContent>
            <Stepper initialStep={0} steps={steps}>
              <Step label="Create Admin Account"><AdminStep /></Step>
              <Step label="Configure Store"><StoreStep /></Step>
              <Step label="Finish"><FinishStep /></Step>
            </Stepper>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
