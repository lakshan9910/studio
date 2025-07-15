
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
import { Slider } from "@/components/ui/slider";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const themeColorSchema = z.object({
    h: z.number().min(0).max(360),
    s: z.number().min(0).max(100),
    l: z.number().min(0).max(100),
});

const systemSettingsSchema = z.object({
  currency: z.string().length(3, "Currency code must be 3 characters."),
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

const themeSettingsSchema = z.object({
    themePrimary: themeColorSchema,
    themeBackground: themeColorSchema,
    themeAccent: themeColorSchema,
    themeSidebarBackground: themeColorSchema,
    themeSidebarForeground: themeColorSchema,
});

const settingsSchema = systemSettingsSchema.merge(brandingSettingsSchema).merge(emailSettingsSchema).merge(receiptSettingsSchema).merge(themeSettingsSchema);

type SettingsFormValues = z.infer<typeof settingsSchema>;

function ColorPicker({ form, name, label }: { form: any, name: `themePrimary` | `themeBackground` | `themeAccent` | `themeSidebarBackground` | `themeSidebarForeground`, label: string }) {
    const hsl = form.watch(name);
    const colorString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    return (
        <div className="space-y-2 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <FormLabel>{label}</FormLabel>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground">{`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}</span>
                    <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: colorString }} />
                </div>
            </div>
            <div className="grid grid-cols-[auto,1fr] items-center gap-x-2 gap-y-1 pt-2">
                <span className="text-xs font-medium text-muted-foreground">H</span>
                <FormField control={form.control} name={`${name}.h`} render={({ field }) => (<FormItem><FormControl><Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} max={360} step={1} /></FormControl></FormItem>)} />
                <span className="text-xs font-medium text-muted-foreground">S</span>
                <FormField control={form.control} name={`${name}.s`} render={({ field }) => (<FormItem><FormControl><Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} max={100} step={1} /></FormControl></FormItem>)} />
                <span className="text-xs font-medium text-muted-foreground">L</span>
                <FormField control={form.control} name={`${name}.l`} render={({ field }) => (<FormItem><FormControl><Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} max={100} step={1} /></FormControl></FormItem>)} />
            </div>
        </div>
    );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
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
  
  if (user?.role !== 'Admin') {
    return null;
  }
  
  const currentLogoUrl = preview || settings.storeLogo;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                 <Card>
                    <CardHeader>
                        <CardTitle>Branding Settings</CardTitle>
                        <CardDescription>Customize the name and logo of your business.</CardDescription>
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
                        <CardTitle>Theme Customization</CardTitle>
                        <CardDescription>Adjust the application's color scheme for the main content area.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ColorPicker form={form} name="themePrimary" label="Primary Color" />
                        <ColorPicker form={form} name="themeBackground" label="Background Color" />
                        <ColorPicker form={form} name="themeAccent" label="Accent Color" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sidebar Theme</CardTitle>
                        <CardDescription>Customize the colors for the navigation sidebar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ColorPicker form={form} name="themeSidebarBackground" label="Sidebar Background" />
                        <ColorPicker form={form} name="themeSidebarForeground" label="Sidebar Text" />
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle>System Settings</CardTitle>
                        <CardDescription>Configure general settings for the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
