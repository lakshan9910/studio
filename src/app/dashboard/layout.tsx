
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
    LogOut, Settings, Store, Users, BarChart3, ShoppingCart, Receipt, Undo2, 
    Shapes, Shield, Beaker, Truck, UserCog, Wallet, Package, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');

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
  
  const navLinks = [
    { 
        category: 'Storefront',
        adminOnly: false,
        links: [
            { href: '/dashboard', label: 'POS', icon: Store },
        ]
    },
    {
        category: 'Analytics & Finance',
        adminOnly: true,
        links: [
            { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
            { href: '/dashboard/purchases', label: 'Purchases', icon: ShoppingCart },
            { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
            { href: '/dashboard/expense-categories', label: 'Expense Categories', icon: Wallet },
        ]
    },
    {
        category: 'General',
        adminOnly: false,
        links: [
             { href: '/dashboard/returns', label: 'Returns', icon: Undo2 },
             { href: '/dashboard/customers', label: 'Customers', icon: Users },
        ]
    },
    {
        category: 'Product Management',
        adminOnly: true,
        links: [
            { href: '/dashboard/categories', label: 'Categories', icon: Shapes },
            { href: '/dashboard/brands', label: 'Brands', icon: Shield },
            { href: '/dashboard/units', label: 'Units', icon: Beaker },
        ]
    },
    {
        category: 'User & Supplier Management',
        adminOnly: true,
        links: [
            { href: '/dashboard/suppliers', label: 'Suppliers', icon: Truck },
            { href: '/dashboard/users', label: 'Users', icon: UserCog },
        ]
    },
  ];

  const filteredNavLinks = navLinks.map(section => {
    if (section.adminOnly && !isAdmin) {
        return null;
    }
    const filteredLinks = section.links.filter(link => 
        link.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredLinks.length > 0) {
        return { ...section, links: filteredLinks };
    }
    return null;
  }).filter(Boolean);


  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex flex-col gap-2 border-b p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold mb-2">
                {settings.storeLogo ? (
                    <Image src={settings.storeLogo} alt={settings.storeName} width={24} height={24} className="object-contain" />
                ) : (
                    <Package className="h-6 w-6" />
                )}
                <span className="">{settings.storeName}</span>
            </Link>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search modules..."
                    className="w-full rounded-lg bg-muted pl-8 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <nav className="flex flex-col gap-4 p-4 text-sm font-medium overflow-y-auto">
          {filteredNavLinks.map((section, index) => (
            section && (
              <div key={index}>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">{section.category}</h3>
                <div className='flex flex-col gap-1'>
                    {section.links.map((link, linkIndex) => (
                        <Link 
                            key={linkIndex} 
                            href={link.href} 
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10",
                                pathname === link.href && "text-primary bg-primary/10"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}
                </div>
              </div>
            )
          ))}
        </nav>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
         <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar>
                    <AvatarImage src={user.imageUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
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
        </header>
        <main className="flex-1 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

    