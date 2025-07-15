
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { 
    LogOut, Settings, Store, Users, BarChart3, ShoppingCart, Receipt, Undo2, 
    Shapes, Shield, Beaker, Truck, UserCog, Wallet, Package, Search,
    Calculator, Bell, Menu, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from "@/hooks/use-toast";

function SimpleCalculator() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const handleButtonClick = (value: string) => {
        if (value === '=') {
            try {
                // Using a safer evaluation method is recommended in a real app
                setResult(new Function('return ' + input)());
            } catch (error) {
                setResult('Error');
            }
        } else if (value === 'C') {
            setInput('');
            setResult('');
        } else {
            setInput(prev => prev + value);
        }
    };
    
    const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];

    return (
        <div className="p-2">
            <div className="bg-muted text-right p-2 rounded-lg mb-2 min-h-[4rem]">
                <div className="text-sm text-muted-foreground">{input}</div>
                <div className="text-xl font-bold">{result}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {buttons.map(btn => (
                    <Button key={btn} onClick={() => handleButtonClick(btn)} variant="outline">
                        {btn}
                    </Button>
                ))}
                 <Button onClick={() => handleButtonClick('C')} variant="destructive" className="col-span-4">
                    Clear
                </Button>
            </div>
        </div>
    );
}

const NavContent = ({ searchTerm, isAdmin, t }: { searchTerm: string, isAdmin: boolean, t: (key: string) => string }) => {
    const pathname = usePathname();
    const navLinks = [
        { 
            category: t('storefront'),
            adminOnly: false,
            links: [
                { href: '/dashboard', label: 'POS', icon: Store },
            ]
        },
        {
            category: t('analytics_finance'),
            adminOnly: true,
            links: [
                { href: '/dashboard/reports', label: t('reports'), icon: BarChart3 },
                { href: '/dashboard/purchases', label: t('purchases'), icon: ShoppingCart },
                { href: '/dashboard/expenses', label: t('expenses'), icon: Receipt },
                { href: '/dashboard/expense-categories', label: t('expense_categories'), icon: Wallet },
            ]
        },
        {
            category: t('general'),
            adminOnly: false,
            links: [
                 { href: '/dashboard/returns', label: t('returns'), icon: Undo2 },
                 { href: '/dashboard/customers', label: t('customers'), icon: Users },
            ]
        },
        {
            category: t('product_management'),
            adminOnly: true,
            links: [
                { href: '/dashboard/products', label: t('products'), icon: Package },
                { href: '/dashboard/categories', label: t('categories'), icon: Shapes },
                { href: '/dashboard/brands', label: t('brands'), icon: Shield },
                { href: '/dashboard/units', label: t('units'), icon: Beaker },
            ]
        },
        {
            category: t('user_supplier_management'),
            adminOnly: true,
            links: [
                { href: '/dashboard/suppliers', label: t('suppliers'), icon: Truck },
                { href: '/dashboard/users', label: t('users'), icon: UserCog },
            ]
        },
    ];

    const filteredNavLinks = navLinks
        .map(section => {
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
        })
        .filter(Boolean);

    return (
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
    );
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { settings, setLanguage, t } = useSettings();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [time, setTime] = useState<Date | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-sidebar text-sidebar-foreground md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    {settings.storeLogo ? (
                        <Image src={settings.storeLogo} alt={settings.storeName} width={24} height={24} className="object-contain" />
                    ) : (
                        <Package className="h-6 w-6" />
                    )}
                    <span className="">{settings.storeName}</span>
                </Link>
            </div>
            <div className="flex-1">
                <div className='p-4'>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t('search_modules')}
                            className="w-full rounded-lg bg-background pl-8 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <NavContent searchTerm={searchTerm} isAdmin={isAdmin} t={t} />
            </div>
        </div>
      </aside>

      <div className="flex flex-col">
         <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent 
                    side="left" 
                    className="flex flex-col p-0 bg-sidebar text-sidebar-foreground"
                >
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            {settings.storeLogo ? (
                                <Image src={settings.storeLogo} alt={settings.storeName} width={24} height={24} className="object-contain" />
                            ) : (
                                <Package className="h-6 w-6" />
                            )}
                            <span className="">{settings.storeName}</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <NavContent searchTerm={searchTerm} isAdmin={isAdmin} t={t}/>
                    </div>
                </SheetContent>
            </Sheet>
            
            <div className='flex w-full items-center justify-end gap-4 md:ml-auto'>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <Calculator className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <SimpleCalculator />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <Bell className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                        <p className="text-sm">{t('no_notifications')}</p>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-muted-foreground">
                        {time ? time.toLocaleTimeString() : '...'}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <Globe className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuLabel>{t('select_language')}</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={() => setLanguage('en')}>English</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setLanguage('mg')}>Malagasy</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setLanguage('ar')}>Arabic</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setLanguage('si')}>Sinhala</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setLanguage('ta')}>Tamil</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                <span>{t('settings')}</span>
                            </Link>
                        </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('logout')}</span>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
        <footer className="border-t bg-muted/40 px-4 lg:px-6 py-3 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Solo solutions. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
