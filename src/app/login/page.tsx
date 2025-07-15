
"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Store, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, { message: "Code must be 6 digits." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const { login, verifyTwoFactor, user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "password123",
    },
  });

  const twoFactorForm = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      const userAttempt = await login(data.email, data.password);
      if (userAttempt.twoFactorEnabled) {
        setTempUser(userAttempt);
        setShowTwoFactor(true);
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
        loginForm.setError("root", { message: error.message });
    }
  };
  
  const onTwoFactorSubmit = async (data: TwoFactorFormValues) => {
      if (!tempUser) return;
      try {
          await verifyTwoFactor(tempUser.id, data.code);
          router.push("/dashboard");
      } catch (error: any) {
          twoFactorForm.setError("root", { message: error.message });
      }
  }

  const renderLoginForm = () => (
     <Card>
        <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account. <br/> Use <b>admin@example.com</b> and password <b>password123</b> to log in as an Admin.</CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            {loginForm.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.root.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            </form>
        </Form>
        <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
            Sign up
            </Link>
        </div>
        </CardContent>
    </Card>
  );

  const renderTwoFactorForm = () => (
     <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck/> Two-Factor Authentication</CardTitle>
        <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...twoFactorForm}>
            <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-4">
                <FormField
                    control={twoFactorForm.control}
                    name="code"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Authentication Code</FormLabel>
                        <FormControl>
                        <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 {twoFactorForm.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">{twoFactorForm.formState.errors.root.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={twoFactorForm.formState.isSubmitting}>
                    {twoFactorForm.formState.isSubmitting ? "Verifying..." : "Verify"}
                </Button>
            </form>
        </Form>
         <Button variant="link" size="sm" className="mt-4 px-0" onClick={() => setShowTwoFactor(false)}>Back to Login</Button>
        </CardContent>
    </Card>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="w-full max-w-md p-4">
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        {settings.storeLogo ? (
                            <Image src={settings.storeLogo} alt={settings.storeName} width={24} height={24} className="object-contain" />
                        ) : (
                            <Store className="text-primary h-6 w-6" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{settings.storeName}</h1>
                </div>
            </div>
            {showTwoFactor ? renderTwoFactorForm() : renderLoginForm()}
        </div>
    </div>
  );
}
