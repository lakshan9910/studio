
"use client";

import { useState, useEffect } from 'react';
import type { Sale, Customer, Product, ProductVariant } from '@/types';
import { initialSales, initialCustomers, initialProducts } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { format, isToday, isThisMonth } from 'date-fns';

const LOW_STOCK_THRESHOLD = 10;

export default function HomePage() {
  const { user, users } = useAuth();
  const { settings, t } = useSettings();
  const [sales] = useState<Sale[]>(initialSales);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [products] = useState<Product[]>(initialProducts);

  const dashboardData = (() => {
    const todaySales = sales.filter(s => isToday(new Date(s.date)));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

    const newCustomersThisMonth = customers.filter(c => c.createdAt && isThisMonth(new Date(c.createdAt))).length;
    
    const lowStockItems = products.flatMap(p => 
      p.variants.filter(v => v.stock > 0 && v.stock < LOW_STOCK_THRESHOLD)
    );

    const recentSales = sales.slice(0, 5);

    return {
      todayRevenue,
      todaySalesCount: todaySales.length,
      newCustomersThisMonth,
      lowStockItemsCount: lowStockItems.length,
      recentSales
    };
  })();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              from {dashboardData.todaySalesCount} sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardData.newCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.lowStockItemsCount}</div>
            <p className="text-xs text-muted-foreground">
                items below threshold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              active products
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              A list of your most recent sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{sale.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {sale.items.length} items
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(sale.date), "PPP")}</TableCell>
                      <TableCell className="text-right font-medium">${sale.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
             <CardDescription>
              Jump directly into common tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
             <Link href="/dashboard" legacyBehavior passHref>
                <Button className="w-full justify-start">
                    <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
                </Button>
            </Link>
             <Link href="/dashboard/products" legacyBehavior passHref>
                <Button variant="secondary" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </Link>
             <Link href="/dashboard/expenses" legacyBehavior passHref>
                <Button variant="secondary" className="w-full justify-start">
                    <Receipt className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </Link>
             <Link href="/dashboard/reports" legacyBehavior passHref>
                <Button variant="secondary" className="w-full justify-start">
                    <ArrowRight className="mr-2 h-4 w-4" /> View All Reports
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
