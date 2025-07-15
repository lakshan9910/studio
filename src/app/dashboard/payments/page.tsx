
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { initialSales, initialCustomers } from "@/lib/data";
import type { Sale, Customer, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { History, Search, CalendarIcon, User, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { format, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";

const ROWS_PER_PAGE = 10;

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [sales] = useState<Sale[]>(initialSales);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<{
    date: Date | null;
    customerId: string | null;
    paymentMethod: PaymentMethod | null;
  }>({
    date: null,
    customerId: null,
    paymentMethod: null
  });

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

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        // Search term filter
        const matchesSearch = sale.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          sale.paymentMethod.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          sale.customerName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

        // Date filter
        const matchesDate = !filters.date || isSameDay(new Date(sale.date), filters.date);
        
        // Customer filter
        const matchesCustomer = !filters.customerId || sale.customerId === filters.customerId;

        // Payment method filter
        const matchesPaymentMethod = !filters.paymentMethod || sale.paymentMethod === filters.paymentMethod;

        return matchesSearch && matchesDate && matchesCustomer && matchesPaymentMethod;
      });
  }, [sales, debouncedSearchTerm, filters]);

  const totalPages = Math.ceil(filteredSales.length / ROWS_PER_PAGE);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredSales.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredSales, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters]);
  
  const handleClearFilters = () => {
    setFilters({ date: null, customerId: null, paymentMethod: null });
    setSearchTerm('');
  };


  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6" /> Payments History
              </CardTitle>
              <CardDescription>
                View and filter all completed sales transactions.
              </CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID, customer..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-4 py-4 px-2 border-y mb-4 bg-muted/50 rounded-lg">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-[240px] justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.date ? format(filters.date, "PPP") : <span>Filter by date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={filters.date || undefined}
                            onSelect={(date) => setFilters(f => ({ ...f, date: date || null }))}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                 <Select
                    value={filters.customerId || ''}
                    onValueChange={(value) => setFilters(f => ({...f, customerId: value || null}))}
                >
                    <SelectTrigger className="w-[240px]">
                        <User className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by customer" />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.paymentMethod || ''}
                    onValueChange={(value) => setFilters(f => ({...f, paymentMethod: value as PaymentMethod || null}))}
                >
                    <SelectTrigger className="w-[240px]">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                      <TableCell>{format(new Date(sale.date), "PPP p")}</TableCell>
                      <TableCell>{sale.customerName || 'N/A'}</TableCell>
                       <TableCell>
                          {sale.items.map(item => item.quantity).reduce((a,b) => a + b, 0)}
                      </TableCell>
                      <TableCell>
                          <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}>{sale.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">${sale.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
