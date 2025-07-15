
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Sale, Purchase, Return, Product, Category, Expense, Customer, ProductVariant, Attendance, User, Payroll, CashDrawerSession } from '@/types';
import { initialSales, initialPurchases, initialReturns, initialProducts, initialCategories, initialExpenses, initialCustomers, initialAttendance, initialCashDrawerSessions } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Layers, Receipt, ShoppingCart, Package, Users, UserCheck, UserX, Coffee, Briefcase, Calendar as CalendarIcon, CaseSensitive } from 'lucide-react';
import { SalesChart } from '@/components/reports/SalesChart';
import { CategoryPieChart } from '@/components/reports/CategoryPieChart';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const LOW_STOCK_THRESHOLD = 10;

export default function ReportsPage() {
    const { user: currentUser, users, loading: authLoading, hasPermission } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useSettings();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Mocked data, in a real app this would be fetched
    const [sales] = useState<Sale[]>(initialSales);
    const [purchases] = useState<Purchase[]>(initialPurchases);
    const [returns] = useState<Return[]>(initialReturns);
    const [products] = useState<Product[]>(initialProducts);
    const [categories] = useState<Category[]>(initialCategories);
    const [expenses] = useState<Expense[]>(initialExpenses);
    const [customers] = useState<Customer[]>(initialCustomers);
    const [attendance] = useState<Attendance[]>(initialAttendance);
    const [payrolls] = useState<Payroll[]>([]); // Assuming payrolls are generated, not pre-filled
    const [cashDrawerSessions] = useState<CashDrawerSession[]>(initialCashDrawerSessions);
    
    useEffect(() => {
        if (!authLoading && !hasPermission('reports:read')) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to view this page.',
          });
          router.replace('/dashboard');
        }
    }, [currentUser, authLoading, router, toast, hasPermission]);

    const reportData = useMemo(() => {
        const { from, to } = dateRange || {};
        if (!from || !to) {
            return {
                totalRevenue: 0, grossProfit: 0, netProfit: 0, totalSalesCount: 0,
                salesChartData: [], categoryChartData: [], topSellingProducts: [],
                topCustomers: [], lowStockProducts: [], attendanceSummary: [], payrollSummary: { totalNetPay: 0, totalBonuses: 0, totalDeductions: 0 },
                filteredCashDrawerSessions: []
            };
        }
        
        const filteredSales = sales.filter(s => isWithinInterval(new Date(s.date), { start: from, end: to }));
        const filteredPurchases = purchases.filter(p => isWithinInterval(new Date(p.date), { start: from, end: to }));
        const filteredReturns = returns.filter(r => isWithinInterval(new Date(r.date), { start: from, end: to }));
        const filteredExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), { start: from, end: to }));
        const filteredAttendance = attendance.filter(a => isWithinInterval(new Date(a.date), { start: from, end: to }));
        const filteredPayrolls = payrolls.filter(p => isWithinInterval(new Date(p.dateFrom), { start: from, end: to }));
        const filteredCashDrawerSessions = cashDrawerSessions.filter(s => isWithinInterval(parseISO(s.startTime), { start: from, end: to }));
        
        const productMap = new Map(products.map(p => [p.id, p]));
        const variantMap = new Map<string, {product: Product, variant: ProductVariant}>();
        products.forEach(p => p.variants.forEach(v => variantMap.set(v.id, {product: p, variant: v})));
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));
        
        const productCosts = new Map<string, number>();
        purchases.forEach(purchase => {
            if (purchase.status === 'Completed') {
                purchase.items.forEach(item => productCosts.set(item.variantId, item.cost));
            }
        });

        let totalRevenue = 0;
        let totalCostOfGoods = 0;
        const salesByDay: { [key: string]: number } = {};
        const salesByCustomer: { [key: string]: { name: string, revenue: number } } = {};
        const categorySales: { [key: string]: { name: string, value: number, fill: string } } = {};
        const categoryColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
        const salesByVariant: { [key: string]: { name: string, variantName: string, quantity: number, revenue: number, imageUrl: string } } = {};

        categories.forEach((cat, index) => {
            categorySales[cat.id] = { name: cat.name, value: 0, fill: categoryColors[index % categoryColors.length] };
        });

        filteredSales.forEach(sale => {
            totalRevenue += sale.total;
            const date = new Date(sale.date).toISOString().split('T')[0];
            salesByDay[date] = (salesByDay[date] || 0) + sale.total;
            
            if (sale.customerId && sale.customerName) {
                if (!salesByCustomer[sale.customerId]) {
                    salesByCustomer[sale.customerId] = { name: sale.customerName, revenue: 0 };
                }
                salesByCustomer[sale.customerId].revenue += sale.total;
            }

            sale.items.forEach(item => {
                const cost = productCosts.get(item.variantId) || 0;
                totalCostOfGoods += cost * item.quantity;
                const product = productMap.get(item.productId);
                if (product && categorySales[product.category]) {
                    categorySales[product.category].value += item.price * item.quantity;
                }
                
                if (!salesByVariant[item.variantId]) {
                    salesByVariant[item.variantId] = { name: item.productName, variantName: item.variantName, quantity: 0, revenue: 0, imageUrl: product?.imageUrl || '' };
                }
                salesByVariant[item.variantId].quantity += item.quantity;
                salesByVariant[item.variantId].revenue += item.price * item.quantity;
            });
        });

        const totalExpenses = filteredExpenses.reduce((sum, current) => sum + current.amount, 0);
        const totalLossFromReturns = filteredReturns.reduce((sum, current) => current.status === 'Completed' ? sum + current.totalValue : sum, 0);
        const grossProfit = totalRevenue - totalCostOfGoods;
        const netProfit = grossProfit - totalExpenses - totalLossFromReturns;
        
        const dateInterval = eachDayOfInterval({ start: from, end: to });
        const salesChartData = dateInterval.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return {
                name: format(day, 'MMM d'),
                total: salesByDay[dateStr] || 0,
            }
        });

        const categoryChartData = Object.values(categorySales).filter(c => c.value > 0);
        const topSellingProducts = Object.values(salesByVariant).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const topCustomers = Object.values(salesByCustomer).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const lowStockProducts = Array.from(variantMap.values()).filter(({ variant }) => variant.stock < LOW_STOCK_THRESHOLD).sort((a, b) => a.variant.stock - b.variant.stock);
        
        const attendanceSummary = users.map(u => {
            const userAttendance = filteredAttendance.filter(a => a.userId === u.id);
            return {
                userId: u.id,
                name: u.name,
                present: userAttendance.filter(a => a.status === 'Present').length,
                absent: userAttendance.filter(a => a.status === 'Absent').length,
                leave: userAttendance.filter(a => a.status === 'Leave').length,
            };
        });

        const payrollSummary = filteredPayrolls.reduce((acc, payroll) => {
            payroll.items.forEach(item => {
                acc.totalNetPay += item.netPay;
                acc.totalBonuses += item.bonus;
                acc.totalDeductions += item.deductions.reduce((sum, d) => sum + d.amount, 0);
            });
            return acc;
        }, { totalNetPay: 0, totalBonuses: 0, totalDeductions: 0 });

        return {
            totalRevenue, grossProfit, netProfit, totalSalesCount: filteredSales.length,
            salesChartData, categoryChartData, topSellingProducts, topCustomers, lowStockProducts,
            attendanceSummary, payrollSummary, filteredCashDrawerSessions
        };

    }, [sales, purchases, returns, products, categories, expenses, customers, users, attendance, payrolls, cashDrawerSessions, dateRange]);

    if (authLoading || !hasPermission('reports:read')) {
        return null;
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{t('reports_dashboard_title')}</h1>
            <Popover>
                <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className="w-[300px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
        
        <h2 className="text-xl font-semibold tracking-tight">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{reportData.totalSalesCount} transactions</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('net_profit')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.netProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">After costs and expenses</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('gross_profit')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.grossProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('gross_profit_desc')}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reportData.topCustomers[0]?.name || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">by revenue in this period</p>
                </CardContent>
            </Card>
        </div>

        <h2 className="text-xl font-semibold tracking-tight">Sales & Customer Reports</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                    <CardTitle>{t('sales_overview')}</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <SalesChart data={reportData.salesChartData} />
                </CardContent>
            </Card>
             <Card className="col-span-1 lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('sales_by_category')}</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <CategoryPieChart data={reportData.categoryChartData} />
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {reportData.topSellingProducts.map(p => (
                                <TableRow key={p.name + p.variantName}><TableCell>{p.name} ({p.variantName})</TableCell><TableCell>{p.quantity}</TableCell><TableCell className="text-right">${p.revenue.toFixed(2)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="text-right">Total Spent</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {reportData.topCustomers.map((c) => (
                                <TableRow key={c.name}><TableCell>{c.name}</TableCell><TableCell className="text-right">${c.revenue.toFixed(2)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
        <h2 className="text-xl font-semibold tracking-tight">Inventory Reports</h2>
         <Card>
            <CardHeader><CardTitle>Low Stock Report</CardTitle><CardDescription>Products with stock levels below the threshold of {LOW_STOCK_THRESHOLD}.</CardDescription></CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Stock Remaining</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {reportData.lowStockProducts.map(({ product, variant }) => (
                            <TableRow key={variant.id}><TableCell>{product.name} ({variant.name})</TableCell><TableCell>{variant.sku}</TableCell><TableCell className="text-right text-destructive font-bold">{variant.stock}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <h2 className="text-xl font-semibold tracking-tight">Financial Reports</h2>
         <Card>
            <CardHeader><CardTitle>Cash Register Report</CardTitle><CardDescription>Summary of cash drawer sessions in this period.</CardDescription></CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Opening</TableHead>
                            <TableHead>Closing</TableHead>
                            <TableHead>Variance</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.filteredCashDrawerSessions.length > 0 ? reportData.filteredCashDrawerSessions.map(s => (
                            <TableRow key={s.id}>
                                <TableCell>{format(parseISO(s.startTime), "PPp")}</TableCell>
                                <TableCell>{s.endTime ? format(parseISO(s.endTime), "PPp") : 'N/A'}</TableCell>
                                <TableCell>${s.openingFloat.toFixed(2)}</TableCell>
                                <TableCell>{s.closingFloat ? `$${s.closingFloat.toFixed(2)}` : 'N/A'}</TableCell>
                                <TableCell className={s.variance && s.variance !== 0 ? 'text-destructive font-bold' : ''}>
                                    {s.variance ? `$${s.variance.toFixed(2)}` : 'N/A'}
                                </TableCell>
                                <TableCell><Badge variant={s.status === 'Active' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">No session history found for this period.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <h2 className="text-xl font-semibold tracking-tight">HRM Reports</h2>
        <div className="grid gap-8 md:grid-cols-2">
             <Card>
                <CardHeader><CardTitle>Attendance Summary</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-center">Present</TableHead><TableHead className="text-center">Absent</TableHead><TableHead className="text-center">Leave</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {reportData.attendanceSummary.map(a => (
                                <TableRow key={a.userId}>
                                    <TableCell>{a.name}</TableCell>
                                    <TableCell className="text-center font-semibold text-green-600">{a.present}</TableCell>
                                    <TableCell className="text-center font-semibold text-red-600">{a.absent}</TableCell>
                                    <TableCell className="text-center font-semibold text-yellow-600">{a.leave}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Payroll Quick Summary</CardTitle><CardDescription>Summary of generated payrolls in this period.</CardDescription></CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">Total Net Pay</span>
                            <span className="font-bold text-lg">${reportData.payrollSummary.totalNetPay.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">Total Bonuses Paid</span>
                            <span className="font-bold text-lg">${reportData.payrollSummary.totalBonuses.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="font-medium">Total Deductions</span>
                            <span className="font-bold text-lg">${reportData.payrollSummary.totalDeductions.toFixed(2)}</span>
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
