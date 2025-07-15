
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Sale, Purchase, Return, Product, Category, Expense } from '@/types';
import { initialSales, initialPurchases, initialReturns, initialProducts, initialCategories, initialExpenses } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Layers, Receipt } from 'lucide-react';
import { SalesChart } from '@/components/reports/SalesChart';
import { CategoryPieChart } from '@/components/reports/CategoryPieChart';
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useSettings();

    const [sales] = useState<Sale[]>(initialSales);
    const [purchases] = useState<Purchase[]>(initialPurchases);
    const [returns] = useState<Return[]>(initialReturns);
    const [products] = useState<Product[]>(initialProducts);
    const [categories] = useState<Category[]>(initialCategories);
    const [expenses] = useState<Expense[]>(initialExpenses);
    
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

    const reportData = useMemo(() => {
        const productMap = new Map(products.map(p => [p.id, p]));
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

        return {
            totalRevenue,
            grossProfit,
            netProfit,
            totalExpenses,
            totalLossFromReturns,
            salesChartData,
            categoryChartData
        };

    }, [sales, purchases, returns, products, categories, expenses]);

    if (user?.role !== 'Admin') {
        return null;
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('reports_dashboard_title')}</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('total_revenue_desc')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('gross_profit')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.grossProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('gross_profit_desc')}</p>
                </CardContent>
            </Card>
             <Card>
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
                    <CardTitle className="text-sm font-medium">{t('total_expenses')}</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalExpenses.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('total_expenses_desc')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('loss_from_returns')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalLossFromReturns.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{t('loss_from_returns_desc')}</p>
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

    </div>
  );
}
