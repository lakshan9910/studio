
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from '@/context/AuthContext';
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileInput } from "@/components/ui/file-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";
import { format } from 'date-fns';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const systemSettingsSchema = z.object({
  currency: z.string().length(3, "Currency code must be 3 characters."),
  enableCashDrawer: z.boolean(),
});

const brandingSettingsSchema = z.object({
    storeName: z.string().min(1, "Store name is required."),
    storeLogo: z.string().optional(),
    logoFile: z
        .any()
        .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
        .refine(
          (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
          ".jpg, .jpeg, .png and .webp files are accepted."
        )
        .optional(),
})

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

const payrollSettingsSchema = z.object({
    payrollType: z.enum(['salaryTheory', 'wagesBoard']),
});

const taxSettingsSchema = z.object({
  enableTax: z.boolean(),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative.").max(100, "Tax rate cannot exceed 100."),
});

const settingsSchema = systemSettingsSchema
    .merge(brandingSettingsSchema)
    .merge(emailSettingsSchema)
    .merge(receiptSettingsSchema)
    .merge(payrollSettingsSchema)
    .merge(taxSettingsSchema);

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, loading, hasPermission } = useAuth();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
  });

  const logoFile = form.watch("logoFile");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const file = logoFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [logoFile]);


  useEffect(() => {
    if (!loading && !hasPermission('settings:write')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [user, loading, router, toast, hasPermission]);

  useEffect(() => {
    form.reset(settings);
    setPreview(settings.storeLogo || null);
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    let logoDataUrl = settings.storeLogo;
    if (data.logoFile && data.logoFile.length > 0) {
        const file = data.logoFile[0];
        const reader = new FileReader();
        logoDataUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    const { logoFile, ...newSettings } = data;
    
    updateSettings({ ...newSettings, storeLogo: logoDataUrl });

    toast({
        title: "Settings Saved",
        description: "Your new settings have been applied.",
    });
  };

  const handleBackup = () => {
    try {
        const backupData: { [key: string]: any } = {};
        const keysToBackup = [
            'appSettings',
            'MOCK_USERS',
            'pos_products',
            'pos_categories',
            'pos_brands',
            'pos_units',
            'pos_customers',
            'pos_sales'
        ];

        keysToBackup.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                backupData[key] = JSON.parse(item);
            }
        });
        
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: "Backup Successful",
            description: "Your data has been downloaded.",
        });

    } catch (error) {
        console.error("Backup failed:", error);
        toast({
            variant: "destructive",
            title: "Backup Failed",
            description: "Could not export your data. Check the console for errors.",
        });
    }
  };
  
  if (!user || !hasPermission('settings:write')) {
    return null;
  }
  
  const currentLogoUrl = preview || settings.storeLogo;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">System Settings</h1>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                 <Card>
                    <CardHeader>
                        <CardTitle>Branding Settings</CardTitle>
                        <CardDescription>Customize the name and logo of your business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
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
                            name="logoFile"
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                <FormLabel>Store Logo</FormLabel>
                                <div className="flex items-center gap-4">
                                    {currentLogoUrl ? (
                                        <Image src={currentLogoUrl} alt="Logo preview" width={64} height={64} className="rounded-md object-contain" />
                                    ) : (
                                       <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                           <span className="text-xs text-muted-foreground">No Logo</span>
                                       </div>
                                    )}
                                    <FormControl>
                                        <FileInput
                                        {...rest}
                                        onFileSelect={(files) => onChange(files)}
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Settings</CardTitle>
                        <CardDescription>Configure general settings for the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
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
                         <FormField
                            control={form.control}
                            name="enableCashDrawer"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Cash Drawer Management</FormLabel>
                                    <CardDescription>
                                        Track cash drawer sessions including opening and closing floats.
                                    </CardDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Tax Settings</CardTitle>
                        <CardDescription>Configure sales tax for transactions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <FormField
                            control={form.control}
                            name="enableTax"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Enable Sales Tax</FormLabel>
                                        <CardDescription>
                                            Apply a sales tax to all transactions.
                                        </CardDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="taxRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tax Rate (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 8" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Payroll Settings</CardTitle>
                        <CardDescription>Configure how payroll is calculated.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                         <FormField
                            control={form.control}
                            name="payrollType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payroll Calculation Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a calculation method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="salaryTheory">Salary Theory (30-day month)</SelectItem>
                                            <SelectItem value="wagesBoard">Wages Board (26-day month)</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                    <CardContent className="space-y-4 pt-6">
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
                    <CardContent className="space-y-4 pt-6">
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
        
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export all your application data to a JSON file.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" onClick={handleBackup}>
                    <Download className="mr-2 h-4 w-4" />
                    Backup All Data
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
