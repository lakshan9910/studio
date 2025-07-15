
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialStockAdjustments, initialProducts } from "@/lib/data";
import type { StockAdjustment, Product } from "@/types";
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
import { MoreHorizontal, PlusCircle, Trash, Edit, Trash2, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";

const adjustmentItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  variantId: z.string().min(1, "Variant is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const adjustmentSchema = z.object({
  date: z.string().min(1, "Date is required."),
  reason: z.string().min(3, "Reason is required."),
  type: z.enum(["Addition", "Subtraction"]),
  items: z.array(adjustmentItemSchema).min(1, "Must have at least one item."),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

const ROWS_PER_PAGE = 10;

export default function StockAdjustmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(initialStockAdjustments);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<StockAdjustment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  
  const productMap = useMemo(() => {
    const map = new Map<string, { product: Product, variant: any }>();
    products.forEach(p => {
        p.variants.forEach(v => {
            map.set(v.id, { product: p, variant: v });
        });
    });
    return map;
  }, [products]);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd'), reason: "", type: "Subtraction", items: [] },
  });

  const { fields, append, remove, watch } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = watch();

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

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(adj =>
      adj.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      adj.reason.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [adjustments, debouncedSearchTerm]);

  const totalPages = Math.ceil(filteredAdjustments.length / ROWS_PER_PAGE);

  const paginatedAdjustments = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredAdjustments.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredAdjustments, currentPage]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleOpenModal = (adjustment: StockAdjustment | null = null) => {
    setEditingAdjustment(adjustment);
    if (adjustment) {
      form.reset({
        ...adjustment,
        date: format(new Date(adjustment.date), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ date: format(new Date(), 'yyyy-MM-dd'), reason: "", type: "Subtraction", items: [{ productId: "", variantId: "", quantity: 1 }] });
    }
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAdjustment(null);
    form.reset({ date: format(new Date(), 'yyyy-MM-dd'), reason: "", type: "Subtraction", items: [] });
  };

  const onSubmit = (data: AdjustmentFormValues) => {
    setProducts(prevProducts => {
        const newProducts = JSON.parse(JSON.stringify(prevProducts));
        data.items.forEach(item => {
            const product = newProducts.find((p: Product) => p.id === item.productId);
            if (product) {
                const variant = product.variants.find((v: any) => v.id === item.variantId);
                if (variant) {
                    if (data.type === 'Addition') {
                        variant.stock += item.quantity;
                    } else {
                        variant.stock = Math.max(0, variant.stock - item.quantity);
                    }
                }
            }
        });
        return newProducts;
    });

    if (editingAdjustment) {
      setAdjustments(
        adjustments.map((a) =>
          a.id === editingAdjustment.id ? { ...a, ...data } : a
        )
      );
      toast({ title: "Adjustment Updated" });
    } else {
      const newAdjustment: StockAdjustment = {
        id: `adj_${Date.now()}`,
        ...data,
      };
      setAdjustments([newAdjustment, ...adjustments]);
      toast({ title: "Adjustment Recorded" });
    }
    handleCloseModal();
  };

  const handleDeleteAdjustment = (adjustmentId: string) => {
    // Note: This does not revert the stock changes in this simulation.
    setAdjustments(adjustments.filter((a) => a.id !== adjustmentId));
    toast({ title: "Adjustment Deleted" });
  };

  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-6xl mx-auto backdrop-blur-lg bg-white/50 dark:bg-black/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Stock Adjustments</CardTitle>
              <CardDescription>
                Manually adjust stock levels for spoilage, loss, or corrections.
              </CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID or reason..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Adjustment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAdjustments.length > 0 ? (
                  paginatedAdjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="font-mono text-xs">{adj.id}</TableCell>
                      <TableCell>{format(new Date(adj.date), "PPP")}</TableCell>
                      <TableCell>
                          <Badge variant={adj.type === 'Addition' ? 'default' : 'destructive'} className="capitalize">
                            {adj.type === 'Addition' ? <ArrowUpCircle className="mr-1 h-3 w-3"/> : <ArrowDownCircle className="mr-1 h-3 w-3"/>}
                            {adj.type}
                          </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{adj.reason}</TableCell>
                      <TableCell>
                          {adj.items.map(item => {
                            const details = productMap.get(item.variantId);
                            return `${details?.product.name || 'N/A'} (${details?.variant.name || 'N/A'}) (x${item.quantity})`
                          }).join(', ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(adj)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAdjustment(adj.id)} className="text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No adjustments found.
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

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAdjustment ? "Edit Stock Adjustment" : "New Stock Adjustment"}</DialogTitle>
            <DialogDescription>
              {editingAdjustment ? "Update the details of the stock adjustment." : "Record a new adjustment to inventory levels."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment Type</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                               <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                               <SelectItem value="Subtraction">Subtraction (Remove stock)</SelectItem>
                               <SelectItem value="Addition">Addition (Add stock)</SelectItem>
                           </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="e.g., Damaged goods, Stock count correction, etc."
                            className="resize-none"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>


              <div className="space-y-4">
                <FormLabel>Items</FormLabel>
                {fields.map((field, index) => {
                  const selectedProductId = watchedItems.items[index]?.productId;
                  const availableVariants = products.find(p => p.id === selectedProductId)?.variants || [];
                  return(
                    <div key={field.id} className="grid grid-cols-[1fr,1fr,100px,auto] items-end gap-2 p-2 border rounded-md">
                      <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                          <FormItem className="flex-1">
                             <FormLabel className="text-xs">Product</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                 <FormControl>
                                     <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                     {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                 </SelectContent>
                             </Select>
                             <FormMessage />
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name={`items.${index}.variantId`} render={({ field }) => (
                          <FormItem className="flex-1">
                             <FormLabel className="text-xs">Variant</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProductId}>
                                 <FormControl>
                                     <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                     {availableVariants.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                                 </SelectContent>
                             </Select>
                             <FormMessage />
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel className="text-xs">Quantity</FormLabel>
                            <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                      )}/>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", variantId: "", quantity: 1 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Adjustment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
