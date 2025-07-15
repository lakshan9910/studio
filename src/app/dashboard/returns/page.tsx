
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialReturns, initialProducts } from "@/lib/data";
import type { Return, Product } from "@/types";
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
import { useDebounce } from "@/hooks/use-debounce";

const returnItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  reason: z.string().min(3, "Reason is required."),
});

const returnSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  date: z.string().min(1, "Date is required."),
  items: z.array(returnItemSchema).min(1, "Must have at least one item."),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

const ROWS_PER_PAGE = 10;

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>(initialReturns);
  const [products] = useState<Product[]>(initialProducts);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<Return | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const productMap = new Map(products.map(p => [p.id, p]));

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { customerName: "", date: format(new Date(), 'yyyy-MM-dd'), items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const filteredReturns = useMemo(() => {
    return returns.filter(ret =>
        ret.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        ret.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [returns, debouncedSearchTerm]);
  
  const totalPages = Math.ceil(filteredReturns.length / ROWS_PER_PAGE);

  const paginatedReturns = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredReturns.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredReturns, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);


  const handleOpenModal = (returnItem: Return | null = null) => {
    setEditingReturn(returnItem);
    if (returnItem) {
      form.reset({
        ...returnItem,
        date: format(new Date(returnItem.date), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ customerName: "", date: format(new Date(), 'yyyy-MM-dd'), items: [{ productId: "", quantity: 1, reason: "" }] });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingReturn(null);
    form.reset({ customerName: "", date: format(new Date(), 'yyyy-MM-dd'), items: [] });
  };

  const onSubmit = (data: ReturnFormValues) => {
    const totalValue = data.items.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    if (editingReturn) {
      setReturns(
        returns.map((p) =>
          p.id === editingReturn.id ? { ...p, ...data, totalValue } : p
        )
      );
    } else {
      const newReturn: Return = {
        id: `ret_${Date.now()}`,
        status: 'Completed',
        ...data,
        totalValue
      };
      setReturns([...returns, newReturn]);
    }
    handleCloseModal();
  };

  const handleDeleteReturn = (returnId: string) => {
    setReturns(returns.filter((p) => p.id !== returnId));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Returns</CardTitle>
              <CardDescription>
                Manage customer returns and returned stock.
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
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Return
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
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReturns.length > 0 ? (
                  paginatedReturns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-mono text-xs">{returnItem.id}</TableCell>
                      <TableCell className="font-medium">{returnItem.customerName}</TableCell>
                      <TableCell>{format(new Date(returnItem.date), "PPP")}</TableCell>
                      <TableCell>${returnItem.totalValue.toFixed(2)}</TableCell>
                      <TableCell>{returnItem.status}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(returnItem)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteReturn(returnItem.id)} className="text-destructive">
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
                      No returns found.
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
            <DialogTitle>{editingReturn ? "Edit Return" : "Add New Return"}</DialogTitle>
            <DialogDescription>
              {editingReturn ? "Update the details of the return." : "Create a new customer return."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
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
                <FormLabel>Returned Items</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_80px_1fr_auto] items-end gap-2 p-2 border rounded-md">
                    <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                        <FormItem>
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
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name={`items.${index}.reason`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Reason</FormLabel>
                          <FormControl><Input placeholder="e.g., Damaged" {...field} /></FormControl>
                           <FormMessage />
                        </FormItem>
                    )}/>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1, reason: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Return</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
