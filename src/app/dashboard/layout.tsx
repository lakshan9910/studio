
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Store, Users } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <svg
            className="h-8 w-8 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-xl text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'Admin';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Store className="h-6 w-6" />
            <span className="sr-only">Cashy</span>
          </Link>
          <Link href="/dashboard" className="text-foreground transition-colors hover:text-foreground">
            POS
          </Link>
           {isAdmin && (
            <>
              <Link href="/dashboard/reports" className="text-muted-foreground transition-colors hover:text-foreground">
                Reports
              </Link>
              <Link href="/dashboard/purchases" className="text-muted-foreground transition-colors hover:text-foreground">
                Purchases
              </Link>
            </>
           )}
          <Link href="/dashboard/returns" className="text-muted-foreground transition-colors hover:text-foreground">
            Returns
          </Link>
           <Link href="/dashboard/customers" className="text-muted-foreground transition-colors hover:text-foreground">
            Customers
          </Link>
          {isAdmin && (
            <>
              <Link href="/dashboard/suppliers" className="text-muted-foreground transition-colors hover:text-foreground">
                Suppliers
              </Link>
              <Link href="/dashboard/categories" className="text-muted-foreground transition-colors hover:text-foreground">
                Categories
              </Link>
              <Link href="/dashboard/brands" className="text-muted-foreground transition-colors hover:text-foreground">
                Brands
              </Link>
              <Link href="/dashboard/units" className="text-muted-foreground transition-colors hover:text-foreground">
                Units
              </Link>
               <Link href="/dashboard/users" className="text-muted-foreground transition-colors hover:text-foreground">
                Users
              </Link>
            </>
          )}
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className='ml-auto'>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.name || user.email} <span className='text-xs text-muted-foreground'>({user.role})</span></DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                       <DropdownMenuItem asChild>
                          <Link href="/dashboard/settings">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Settings</span>
                          </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
