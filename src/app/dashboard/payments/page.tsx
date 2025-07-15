
      
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { initialSales, initialCustomers } from "@/lib/data";
import type { Sale, Customer, PaymentMethod, PaymentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { History, Search, CalendarIcon, User, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ROWS_PER_PAGE = 10;
const SALES_STORAGE_KEY = 'pos_sales';

export default function PaymentsPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMarkAsPaidOpen, setMarkAsPaidOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [filters, setFilters] = useState<{
    date: Date | null;
    customerId: string | null;
    paymentMethod: PaymentMethod | null;
    paymentStatus: string | null;
  }>({
    date: null,
    customerId: null,
    paymentMethod: null,
    paymentStatus: null,
  });

  useEffect(() => {
    const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
    if (storedSales) {
      setSales(JSON.parse(storedSales));
    } else {
      setSales(initialSales);
    }
  }, []);

  const persistSales = (updatedSales: Sale[]) => {
    setSales(updatedSales);
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales));
  }

  useEffect(() => {
    if (!loading && !hasPermission('payments:read')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [loading, hasPermission, router, toast]);
  
  const getPaymentStatus = (sale: Sale): PaymentStatus => {
    if (sale.paymentStatus === 'Paid') return 'Paid';
    if (sale.dueDate && isBefore(new Date(sale.dueDate), startOfDay(new Date()))) {
        return 'Overdue';
    }
    return 'Due';
  };

  const filteredSales = useMemo(() => {
    return sales
      .map(sale => ({ ...sale, derivedStatus: getPaymentStatus(sale) }))
      .filter(sale => {
        const matchesSearch = sale.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          sale.paymentMethod.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          sale.customerName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

        const matchesDate = !filters.date || isSameDay(new Date(sale.date), filters.date);
        
        const matchesCustomer = !filters.customerId || sale.customerId === filters.customerId;

        const matchesPaymentMethod = !filters.paymentMethod || sale.paymentMethod === filters.paymentMethod;
        
        const matchesPaymentStatus = !filters.paymentStatus || sale.derivedStatus === filters.paymentStatus;

        return matchesSearch && matchesDate && matchesCustomer && matchesPaymentMethod && matchesPaymentStatus;
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
    setFilters({ date: null, customerId: null, paymentMethod: null, paymentStatus: null });
    setSearchTerm('');
  };
  
  const openMarkAsPaid = (sale: Sale) => {
    setSelectedSale(sale);
    setMarkAsPaidOpen(true);
  }

  const handleMarkAsPaid = () => {
    if (!selectedSale || !hasPermission('pos:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    };

    const updatedSales = sales.map(s => 
        s.id === selectedSale.id 
        ? { ...s, paymentStatus: 'Paid', paidAmount: s.total } 
        : s
    );
    persistSales(updatedSales);
    toast({ title: 'Payment Confirmed', description: `Sale ${selectedSale.id.slice(-6)} has been marked as paid.`});
    setMarkAsPaidOpen(false);
    setSelectedSale(null);
  }

  if (loading || !hasPermission('payments:read')) {
    return null;
  }
  
  const paymentStatusMap: { [key in PaymentStatus]: { color: "default" | "destructive" | "secondary", icon: React.ReactNode, label: string } } = {
      Paid: { color: "default", icon: <CheckCircle className="h-3 w-3" />, label: "Paid" },
      Due: { color: "secondary", icon: <History className="h-3 w-3" />, label: "Due" },
      Overdue: { color: "destructive", icon: <AlertCircle className="h-3 w-3" />, label: "Overdue" },
  };

  const canWrite = hasPermission('pos:write');

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
           <div className="flex flex-wrap items-center gap-4 py-4 px-2 border-y mb-4 bg-muted/50 rounded-lg">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-[220px] justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.date ? format(filters.date, "PPP") : <span>Filter by date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarUI
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
                    <SelectTrigger className="w-[200px]">
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
                    <SelectTrigger className="w-[200px]">
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
                
                 <Select
                    value={filters.paymentStatus || ''}
                    onValueChange={(value) => setFilters(f => ({...f, paymentStatus: value || null}))}
                >
                    <SelectTrigger className="w-[200px]">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Due">Due</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
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
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                      <TableCell>{format(new Date(sale.date), "PPP p")}</TableCell>
                      <TableCell>{sale.customerName || 'N/A'}</TableCell>
                      <TableCell>{sale.dueDate ? format(new Date(sale.dueDate), "PPP") : 'N/A'}</TableCell>
                      <TableCell>
                          <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}>{sale.paymentMethod}</Badge>
                      </TableCell>
                       <TableCell>
                          {sale.derivedStatus && (
                            <Badge variant={paymentStatusMap[sale.derivedStatus].color} className="gap-1">
                                {paymentStatusMap[sale.derivedStatus].icon}
                                {paymentStatusMap[sale.derivedStatus].label}
                            </Badge>
                          )}
                      </TableCell>
                      <TableCell className="text-right font-medium">${sale.total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                          {sale.derivedStatus !== 'Paid' && (
                              <Button variant="outline" size="sm" onClick={() => openMarkAsPaid(sale)} disabled={!canWrite}>Mark as Paid</Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
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
       <Dialog open={isMarkAsPaidOpen} onOpenChange={setMarkAsPaidOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Payment</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to mark this sale as paid? This action cannot be undone.
                        <div className="mt-4 rounded-lg border bg-muted p-4 space-y-1 text-sm">
                            <p><strong>Sale ID:</strong> {selectedSale?.id}</p>
                            <p><strong>Customer:</strong> {selectedSale?.customerName}</p>
                            <p><strong>Amount:</strong> ${selectedSale?.total.toFixed(2)}</p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setMarkAsPaidOpen(false)}>Cancel</Button>
                    <Button onClick={handleMarkAsPaid} disabled={!canWrite}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    