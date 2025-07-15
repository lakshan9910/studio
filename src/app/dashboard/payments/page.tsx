
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { initialSales } from "@/lib/data";
import type { Sale } from "@/types";
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
import { History, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const ROWS_PER_PAGE = 10;

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [sales] = useState<Sale[]>(initialSales);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

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
    return sales.filter(sale =>
      sale.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      sale.paymentMethod.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [sales, debouncedSearchTerm]);

  const totalPages = Math.ceil(filteredSales.length / ROWS_PER_PAGE);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredSales.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredSales, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6" /> Payments History
              </CardTitle>
              <CardDescription>
                View all completed sales transactions.
              </CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID or payment method..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
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
                    <TableCell colSpan={5} className="h-24 text-center">
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
