
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialQuotations, initialProducts, initialCustomers } from "@/lib/data";
import type { Quotation, Product, Customer, ProductVariant, QuotationStatus } from "@/types";
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash, Edit, Trash2, Search, Info, CheckCircle, Clock, Send, XCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const quotationItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  variantId: z.string().min(1, "Variant is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  price: z.coerce.number().min(0.01, "Price must be positive."),
});

const quotationSchema = z.object({
  customerId: z.string().min(1, { message: "Customer is required." }),
  date: z.string().min(1, "Date is required."),
  expiryDate: z.string().min(1, "Expiry date is required."),
  items: z.array(quotationItemSchema).min(1, "Must have at least one item."),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

const ROWS_PER_PAGE = 10;

const statusMap: { [key in QuotationStatus]: { color: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode } } = {
  Draft: { color: "secondary", icon: <Clock className="mr-1 h-3 w-3"/> },
  Sent: { color: "outline", icon: <Send className="mr-1 h-3 w-3"/> },
  Accepted: { color: "default", icon: <CheckCircle className="mr-1 h-3 w-3"/> },
  Expired: { color: "destructive", icon: <XCircle className="mr-1 h-3 w-3"/> },
};

export default function QuotationsPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [products] = useState<Product[]>(initialProducts);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const productMap = useMemo(() => {
    const map = new Map<string, { product: Product, variant: ProductVariant }>();
    products.forEach(p => p.variants.forEach(v => map.set(v.id, { product: p, variant: v })));
    return map;
  }, [products]);

  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { customerId: "", date: format(new Date(), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), items: [], notes: "" },
  });

  const { control, watch, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  
  const watchedItems = watch("items");

  // Effect to update price when a variant is selected or product is changed
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type !== 'change' || !name || !name.startsWith('items.')) return;
      
      const parts = name.split('.');
      if (parts.length < 3) return;
      const index = parseInt(parts[1], 10);
      const fieldName = parts[2];
      
      const allItems = value.items || [];
      if (index >= allItems.length) return;

      // When product ID changes, reset the variant ID and price
      if (fieldName === 'productId') {
        setValue(`items.${index}.variantId`, '');
        setValue(`items.${index}.price`, 0);
      }
      
      // When variant ID changes, update the price
      if (fieldName === 'variantId') {
        const selectedProductId = allItems[index]?.productId;
        const selectedVariantId = allItems[index]?.variantId;
        
        if (selectedProductId && selectedVariantId) {
          const product = products.find(p => p.id === selectedProductId);
          const variant = product?.variants.find(v => v.id === selectedVariantId);
          if (variant) {
            setValue(`items.${index}.price`, variant.price, { shouldValidate: true });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, products, setValue]);

  useEffect(() => {
    if (!loading && !hasPermission('quotations:read')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [loading, hasPermission, router, toast]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q =>
      q.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [quotations, debouncedSearchTerm]);
  
  const totalPages = Math.ceil(filteredQuotations.length / ROWS_PER_PAGE);

  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredQuotations.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredQuotations, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm]);

  const handleOpenModal = (quotation: Quotation | null = null) => {
    setEditingQuotation(quotation);
    if (quotation) {
      form.reset({
        ...quotation,
        date: format(new Date(quotation.date), 'yyyy-MM-dd'),
        expiryDate: format(new Date(quotation.expiryDate), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ customerId: "", date: format(new Date(), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), items: [{ productId: "", variantId: "", quantity: 1, price: 0 }], notes: "" });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingQuotation(null);
    form.reset({ customerId: "", date: format(new Date(), 'yyyy-MM-dd'), expiryDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), items: [], notes: "" });
  };

  const onSubmit = (data: QuotationFormValues) => {
    if (!hasPermission('quotations:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    const total = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const customerName = customerMap.get(data.customerId) || 'Unknown Customer';

    if (editingQuotation) {
      setQuotations(
        quotations.map((q) =>
          q.id === editingQuotation.id ? { ...editingQuotation, ...data, total, customerName } : q
        )
      );
      toast({ title: "Quotation Updated" });
    } else {
      const newQuotation: Quotation = {
        id: `quote_${Date.now()}`,
        status: 'Draft',
        customerName,
        ...data,
        total
      };
      setQuotations([newQuotation, ...quotations]);
      toast({ title: "Quotation Created" });
    }
    handleCloseModal();
  };

  const handleDeleteQuotation = (quotationId: string) => {
    if (!hasPermission('quotations:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    setQuotations(quotations.filter((q) => q.id !== quotationId));
    toast({ title: "Quotation Deleted" });
  };

  const updateStatus = (id: string, status: QuotationStatus) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, status } : q));
    toast({ title: `Quotation marked as ${status}`});
  };

  if (loading || !hasPermission('quotations:read')) return null;
  const canWrite = hasPermission('quotations:write');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Quotations</CardTitle>
              <CardDescription>
                Create and manage quotations for your customers.
              </CardDescription>
            </div>
             <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID or customer..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()} disabled={!canWrite}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Quotation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuotations.length > 0 ? (
                  paginatedQuotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.id}</TableCell>
                      <TableCell>{q.customerName}</TableCell>
                      <TableCell>{format(new Date(q.date), "PPP")}</TableCell>
                      <TableCell>{format(new Date(q.expiryDate), "PPP")}</TableCell>
                      <TableCell>${q.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[q.status].color} className="capitalize">{statusMap[q.status].icon}{q.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(q.id, 'Sent')} disabled={!canWrite || q.status !== 'Draft'}><Send className="mr-2 h-4 w-4"/>Mark as Sent</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(q.id, 'Accepted')} disabled={!canWrite || q.status !== 'Sent'}><CheckCircle className="mr-2 h-4 w-4"/>Mark as Accepted</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenModal(q)} disabled={!canWrite}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteQuotation(q.id)} className="text-destructive" disabled={!canWrite}><Trash className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No quotations found.
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
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuotation ? "Edit Quotation" : "Create New Quotation"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="customerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                           <SelectContent>{customers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Quotation Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                 <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>

              <div className="space-y-4">
                <FormLabel>Items</FormLabel>
                {fields.map((field, index) => {
                   const selectedProductId = watchedItems?.[index]?.productId;
                   const availableVariants = products.find(p => p.id === selectedProductId)?.variants || [];
                   return (
                     <div key={field.id} className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] items-end gap-2 p-3 border rounded-lg">
                       <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Product</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger></FormControl><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`items.${index}.variantId`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Variant</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProductId}><FormControl><SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger></FormControl><SelectContent>{availableVariants.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Quantity</FormLabel><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                        <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Unit Price</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Price" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                   );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", variantId: "", quantity: 1, price: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any terms or notes for the customer..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" disabled={!canWrite}>Save Quotation</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
