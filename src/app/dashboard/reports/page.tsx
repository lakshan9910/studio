
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Sale, Purchase, Return, Product, Category, Expense, Customer, ProductVariant } from '@/types';
import { initialSales, initialPurchases, initialReturns, initialProducts, initialCategories, initialExpenses, initialCustomers } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Layers, Receipt, ShoppingCart, Package, Users } from 'lucide-react';
import { SalesChart } from '@/components/reports/SalesChart';
import { CategoryPieChart } from '@/components/reports/CategoryPieChart';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';

const LOW_STOCK_THRESHOLD = 10;

export default function ReportsPage() {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useSettings();

    const [sales] = useState<Sale[]>(initialSales);
    const [purchases] = useState<Purchase[]>(initialPurchases);
    const [returns] = useState<Return[]>(initialReturns);
    const [products] = useState<Product[]>(initialProducts);
    const [categories] = useState<Category[]>(initialCategories);
    const [expenses] = useState<Expense[]>(initialExpenses);
    const [customers] = useState<Customer[]>(initialCustomers);
    
    useEffect(() => {
        if (!loading && !hasPermission('reports:read')) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to view this page.',
          });
          router.replace('/dashboard');
        }
    }, [user, loading, router, toast, hasPermission]);

    const reportData = useMemo(() => {
        const productMap = new Map(products.map(p => [p.id, p]));
        const variantMap = new Map<string, {product: Product, variant: ProductVariant}>();
        products.forEach(p => p.variants.forEach(v => variantMap.set(v.id, {product: p, variant: v})));
        
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));
        
        const productCosts = new Map<string, number>();
        purchases.forEach(purchase => {
            if (purchase.status === 'Completed') {
                purchase.items.forEach(item => {
                    productCosts.set(item.variantId, item.cost);
                });
            }
        });

        let totalRevenue = 0;
        let totalCostOfGoods = 0;
        const salesByDay: { [key: string]: number } = {};
        const categorySales: { [key: string]: { name: string, value: number, fill: string } } = {};
        const categoryColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
        const salesByVariant: { [key: string]: { name: string, variantName: string, quantity: number, revenue: number, imageUrl: string } } = {};

        categories.forEach((cat, index) => {
            categorySales[cat.id] = { name: cat.name, value: 0, fill: categoryColors[index % categoryColors.length] };
        });

        sales.forEach(sale => {
            totalRevenue += sale.total;
            const date = new Date(sale.date).toISOString().split('T')[0];
            salesByDay[date] = (salesByDay[date] || 0) + sale.total;
            
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

        const totalExpenses = expenses.reduce((sum, current) => sum + current.amount, 0);

        const totalLossFromReturns = returns.reduce((sum, current) => {
            if (current.status === 'Completed') {
                return sum + current.totalValue;
            }
            return sum;
        }, 0);

        const grossProfit = totalRevenue - totalCostOfGoods;
        const netProfit = grossProfit - totalExpenses - totalLossFromReturns;
        
        const salesChartData = Object.entries(salesByDay).map(([date, total]) => ({
            name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total,
        })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

        const categoryChartData = Object.values(categorySales).filter(c => c.value > 0);

        const topSellingProducts = Object.values(salesByVariant)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const lowStockProducts = Array.from(variantMap.values())
            .filter(({ variant }) => variant.stock < LOW_STOCK_THRESHOLD)
            .sort((a, b) => a.variant.stock - b.variant.stock);


        return {
            totalRevenue,
            grossProfit,
            netProfit,
            totalExpenses,
            totalLossFromReturns,
            salesChartData,
            categoryChartData,
            totalSalesCount: sales.length,
            totalProductCount: products.length,
            totalCustomerCount: customers.length,
            topSellingProducts,
            lowStockProducts,
        };

    }, [sales, purchases, returns, products, categories, expenses, customers]);

    if (!user || !hasPermission('reports:read')) {
        return null;
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('reports_dashboard_title')}</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('total_revenue_desc')}</p>
                </CardContent>
            </Card>
            <Card className="xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('net_profit')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.netProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('net_profit_desc')}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalSalesCount}</div>
                    <p className="text-xs text-muted-foreground">Number of transactions</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalProductCount}</div>
                    <p className="text-xs text-muted-foreground">Total distinct products</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalCustomerCount}</div>
                    <p className="text-xs text-muted-foreground">Total unique customers</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_expenses')}</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalExpenses.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('total_expenses_desc')}</p>
                </CardContent>
            </Card>
        </div>

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
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.topSellingProducts.map(p => (
                                <TableRow key={p.name + p.variantName}>
                                    <TableCell className="font-medium">{p.name} ({p.variantName})</TableCell>
                                    <TableCell>{p.quantity}</TableCell>
                                    <TableCell className="text-right">${p.revenue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Low Stock Report</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Stock Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.lowStockProducts.map(({ product, variant }) => (
                                <TableRow key={variant.id}>
                                    <TableCell className="font-medium">{product.name} ({variant.name})</TableCell>
                                    <TableCell>{variant.sku}</TableCell>
                                    <TableCell className="text-right text-destructive font-bold">{variant.stock}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

    </div>
  );
}
