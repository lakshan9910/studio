
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialPurchases, initialProducts, initialSuppliers } from "@/lib/data";
import type { Purchase, Product, Supplier } from "@/types";
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash, Edit, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";


const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  variantId: z.string().min(1, "Variant is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  cost: z.coerce.number().min(0.01, "Cost must be positive."),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, { message: "Supplier is required." }),
  date: z.string().min(1, "Date is required."),
  items: z.array(purchaseItemSchema).min(1, "Must have at least one item."),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const ROWS_PER_PAGE = 10;

export default function PurchasesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [products] = useState<Product[]>(initialProducts);
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const productMap = new Map(products.map(p => [p.id, p]));
  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { supplierId: "", date: format(new Date(), 'yyyy-MM-dd'), items: [] },
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

  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase =>
      purchase.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      supplierMap.get(purchase.supplierId)?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [purchases, debouncedSearchTerm, supplierMap]);
  
  const totalPages = Math.ceil(filteredPurchases.length / ROWS_PER_PAGE);

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredPurchases.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredPurchases, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleOpenModal = (purchase: Purchase | null = null) => {
    setEditingPurchase(purchase);
    if (purchase) {
      form.reset({
        ...purchase,
        date: format(new Date(purchase.date), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ supplierId: "", date: format(new Date(), 'yyyy-MM-dd'), items: [{ productId: "", variantId: "", quantity: 1, cost: 0 }] });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPurchase(null);
    form.reset({ supplierId: "", date: format(new Date(), 'yyyy-MM-dd'), items: [] });
  };

  const onSubmit = (data: PurchaseFormValues) => {
    const totalCost = data.items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
    if (editingPurchase) {
      setPurchases(
        purchases.map((p) =>
          p.id === editingPurchase.id ? { ...p, ...data, totalCost } : p
        )
      );
      toast({ title: "Purchase Updated" });
    } else {
      const newPurchase: Purchase = {
        id: `purch_${Date.now()}`,
        status: 'Completed',
        ...data,
        totalCost
      };
      setPurchases([...purchases, newPurchase]);
      toast({ title: "Purchase Added" });
    }
    handleCloseModal();
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setPurchases(purchases.filter((p) => p.id !== purchaseId));
    toast({ title: "Purchase Deleted" });
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
              <CardTitle>Purchases</CardTitle>
              <CardDescription>
                Manage your incoming stock and purchase orders.
              </CardDescription>
            </div>
             <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID or supplier..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Purchase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPurchases.length > 0 ? (
                  paginatedPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-xs">{purchase.id}</TableCell>
                      <TableCell className="font-medium">{supplierMap.get(purchase.supplierId) || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(purchase.date), "PPP")}</TableCell>
                      <TableCell>${purchase.totalCost.toFixed(2)}</TableCell>
                      <TableCell>{purchase.status}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(purchase)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePurchase(purchase.id)} className="text-destructive">
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
                      No purchases found.
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

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPurchase ? "Edit Purchase Order" : "Add New Purchase Order"}</DialogTitle>
            <DialogDescription>
              {editingPurchase ? "Update the details of the purchase." : "Create a new purchase order to track incoming stock."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="supplierId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                               <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                           </FormControl>
                           <SelectContent>
                               {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                           </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>

              <div className="space-y-4">
                <FormLabel>Items</FormLabel>
                {fields.map((field, index) => {
                   const selectedProductId = watchedItems.items[index]?.productId;
                   const availableVariants = products.find(p => p.id === selectedProductId)?.variants || [];
                   return (
                     <div key={field.id} className="grid grid-cols-5 items-end gap-2 p-2 border rounded-md">
                       <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                           <FormItem className="flex-1 col-span-2">
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
                        <FormField control={form.control} name={`items.${index}.cost`} render={({ field }) => (
                           <FormItem className="w-24">
                             <FormLabel className="text-xs">Unit Cost</FormLabel>
                             <FormControl><Input type="number" step="0.01" placeholder="Cost" {...field} /></FormControl>
                              <FormMessage />
                           </FormItem>
                       )}/>
                       <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", variantId: "", quantity: 1, cost: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Purchase</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
