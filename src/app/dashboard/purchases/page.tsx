
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialPurchases, initialProducts } from "@/lib/data";
import type { Purchase, Product } from "@/types";
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";


const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  cost: z.coerce.number().min(0.01, "Cost must be positive."),
});

const purchaseSchema = z.object({
  supplier: z.string().min(2, { message: "Supplier name must be at least 2 characters." }),
  date: z.string().min(1, "Date is required."),
  items: z.array(purchaseItemSchema).min(1, "Must have at least one item."),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function PurchasesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [products] = useState<Product[]>(initialProducts);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const productMap = new Map(products.map(p => [p.id, p]));

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { supplier: "", date: format(new Date(), 'yyyy-MM-dd'), items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
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

  const handleOpenModal = (purchase: Purchase | null = null) => {
    setEditingPurchase(purchase);
    if (purchase) {
      form.reset({
        ...purchase,
        date: format(new Date(purchase.date), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ supplier: "", date: format(new Date(), 'yyyy-MM-dd'), items: [{ productId: "", quantity: 1, cost: 0 }] });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPurchase(null);
    form.reset({ supplier: "", date: format(new Date(), 'yyyy-MM-dd'), items: [] });
  };

  const onSubmit = (data: PurchaseFormValues) => {
    const totalCost = data.items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
    if (editingPurchase) {
      setPurchases(
        purchases.map((p) =>
          p.id === editingPurchase.id ? { ...p, ...data, totalCost } : p
        )
      );
    } else {
      const newPurchase: Purchase = {
        id: `purch_${Date.now()}`,
        status: 'Completed',
        ...data,
        totalCost
      };
      setPurchases([...purchases, newPurchase]);
    }
    handleCloseModal();
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setPurchases(purchases.filter((p) => p.id !== purchaseId));
  };

  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchases</CardTitle>
              <CardDescription>
                Manage your incoming stock and purchase orders.
              </CardDescription>
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
                {purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-xs">{purchase.id}</TableCell>
                      <TableCell className="font-medium">{purchase.supplier}</TableCell>
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
                <FormField control={form.control} name="supplier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Global Foods Inc." {...field} />
                      </FormControl>
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
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
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
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1, cost: 0 })}>
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
