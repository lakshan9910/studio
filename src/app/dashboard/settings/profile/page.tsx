
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { FileInput } from "@/components/ui/file-input";
import { generateTwoFactorSecret, verifyTwoFactorCode, getTwoFactorQRCode } from "@/lib/2fa";
import { LoaderCircle, ShieldCheck, ShieldX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const twoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits."),
});

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

export default function ProfileSettingsPage() {
  const { user, updateUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  const handleEnable2FA = async () => {
    if (!user) return;
    try {
      const secret = generateTwoFactorSecret();
      setTwoFactorSecret(secret);
      const qrCode = await getTwoFactorQRCode(user.email || 'user', secret);
      setQrCodeDataUrl(qrCode);
      setIsEnabling(true);
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not generate QR code."});
    }
  };

  const handleCancelEnable = () => {
      setIsEnabling(false);
      setTwoFactorSecret(null);
      setQrCodeDataUrl(null);
      form.reset();
  }

  const handleVerifyAndEnable = async (data: TwoFactorFormValues) => {
    if (!user || !twoFactorSecret) return;
    const isValid = verifyTwoFactorCode(twoFactorSecret, data.code);
    if (isValid) {
      await updateUser(user.id, { twoFactorEnabled: true, twoFactorSecret });
      toast({ title: "Success", description: "Two-Factor Authentication has been enabled."});
      handleCancelEnable();
    } else {
      form.setError("code", { message: "Invalid code. Please try again." });
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;
    await updateUser(user.id, { twoFactorEnabled: false, twoFactorSecret: undefined });
    toast({ title: "Success", description: "Two-Factor Authentication has been disabled."});
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoaderCircle className="animate-spin" /></div>
  }
  
  if (!user) {
    router.replace('/login');
    return null;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent>
                {!user.twoFactorEnabled ? (
                    isEnabling ? (
                        <div className="space-y-4">
                            <p>1. Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy).</p>
                             {qrCodeDataUrl ? (
                                <div className="p-4 bg-white rounded-lg inline-block">
                                    <Image src={qrCodeDataUrl} alt="2FA QR Code" width={200} height={200} />
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                                    <LoaderCircle className="animate-spin" />
                                </div>
                            )}
                            <p>2. Enter the 6-digit code from your app to verify and enable 2FA.</p>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleVerifyAndEnable)} className="flex items-end gap-4">
                                     <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Verification Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123456" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting}>Verify & Enable</Button>
                                    <Button type="button" variant="outline" onClick={handleCancelEnable}>Cancel</Button>
                                </form>
                            </Form>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                             <ShieldX className="h-10 w-10 text-destructive" />
                             <div>
                                <p className="font-semibold">2FA is currently disabled.</p>
                                <p className="text-sm text-muted-foreground">Enable 2FA to better protect your account.</p>
                             </div>
                            <Button onClick={handleEnable2FA} className="ml-auto">Enable 2FA</Button>
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="h-10 w-10 text-green-500" />
                        <div>
                            <p className="font-semibold">2FA is currently enabled.</p>
                            <p className="text-sm text-muted-foreground">Your account is protected with an additional layer of security.</p>
                        </div>
                        <Button onClick={handleDisable2FA} variant="destructive" className="ml-auto">Disable 2FA</Button>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
