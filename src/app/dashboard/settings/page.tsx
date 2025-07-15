
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const systemSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required."),
  currency: z.string().length(3, "Currency code must be 3 characters."),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required."),
  smtpPort: z.coerce.number().min(1, "Port must be a positive number."),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
});

const receiptSettingsSchema = z.object({
    receiptHeaderText: z.string().optional(),
    receiptFooterText: z.string().optional(),
});

const settingsSchema = systemSettingsSchema.merge(emailSettingsSchema).merge(receiptSettingsSchema);

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<SettingsFormValues>({
    storeName: 'Cashy POS',
    currency: 'USD',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPass: '',
    receiptHeaderText: 'Thank you for your purchase!',
    receiptFooterText: 'Please come again!',
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
  });

  useEffect(() => {
    if (!loading && user?.role !== 'Admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [user, loading, router, toast]);

  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    setSettings(data);
    toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
    });
  };
  
  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>System Settings</CardTitle>
                        <CardDescription>Configure general settings for the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="storeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Store Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Currency Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., USD" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Email Settings</CardTitle>
                        <CardDescription>Configure SMTP settings for sending emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="smtpHost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Host</FormLabel>
                                        <FormControl>
                                            <Input placeholder="smtp.mailserver.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="smtpPort"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Port</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="587" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="smtpUser"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="your-username" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="smtpPass"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Receipt Settings</CardTitle>
                        <CardDescription>Customize the template for printed receipts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="receiptHeaderText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Header Text</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Thank you for shopping with us!" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="receiptFooterText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Footer Text</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Returns accepted within 30 days with receipt." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                <div className="flex justify-end">
                    <Button type="submit">Save Settings</Button>
                </div>
            </form>
        </Form>
      </div>
    </div>
  );
}
