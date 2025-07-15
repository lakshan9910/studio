
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialStockTransfers, initialProducts, initialWarehouses } from "@/lib/data";
import type { StockTransfer, Product, Warehouse, ProductVariant, TransferStatus } from "@/types";
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
import { MoreHorizontal, PlusCircle, Trash, Edit, Trash2, Search, ArrowRight, CheckCircle, Clock, Truck, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const transferItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  variantId: z.string().min(1, "Variant is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const transferSchema = z.object({
  date: z.string().min(1, "Date is required."),
  fromWarehouseId: z.string().min(1, "Source warehouse is required."),
  toWarehouseId: z.string().min(1, "Destination warehouse is required."),
  items: z.array(transferItemSchema).min(1, "Must have at least one item."),
  notes: z.string().optional(),
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
    message: "Source and destination cannot be the same.",
    path: ["toWarehouseId"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

const ROWS_PER_PAGE = 10;

const statusMap: { [key in TransferStatus]: { color: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode } } = {
  Pending: { color: "secondary", icon: <Clock className="mr-1 h-3 w-3"/> },
  'In Transit': { color: "outline", icon: <Truck className="mr-1 h-3 w-3"/> },
  Completed: { color: "default", icon: <CheckCircle className="mr-1 h-3 w-3"/> },
  Cancelled: { color: "destructive", icon: <XCircle className="mr-1 h-3 w-3"/> },
};


export default function StockTransfersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [transfers, setTransfers] = useState<StockTransfer[]>(initialStockTransfers);
  const [products] = useState<Product[]>(initialProducts);
  const [warehouses] = useState<Warehouse[]>(initialWarehouses);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  
  const productMap = useMemo(() => {
    const map = new Map<string, { product: Product, variant: ProductVariant }>();
    products.forEach(p => p.variants.forEach(v => map.set(v.id, { product: p, variant: v })));
    return map;
  }, [products]);

  const warehouseMap = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd'), fromWarehouseId: "", toWarehouseId: "", items: [] },
  });

  const { control, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control: control,
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

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t =>
      t.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      warehouseMap.get(t.fromWarehouseId)?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      warehouseMap.get(t.toWarehouseId)?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [transfers, debouncedSearchTerm, warehouseMap]);

  const totalPages = Math.ceil(filteredTransfers.length / ROWS_PER_PAGE);

  const paginatedTransfers = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredTransfers.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredTransfers, currentPage]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleOpenModal = (transfer: StockTransfer | null = null) => {
    setEditingTransfer(transfer);
    if (transfer) {
      form.reset({
        ...transfer,
        date: format(new Date(transfer.date), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ date: format(new Date(), 'yyyy-MM-dd'), fromWarehouseId: "", toWarehouseId: "", items: [{ productId: "", variantId: "", quantity: 1 }], notes: "" });
    }
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransfer(null);
    form.reset({ date: format(new Date(), 'yyyy-MM-dd'), fromWarehouseId: "", toWarehouseId: "", items: [], notes: "" });
  };

  const onSubmit = (data: TransferFormValues) => {
    if (editingTransfer) {
      setTransfers(transfers.map((t) => (t.id === editingTransfer.id ? { ...editingTransfer, ...data } : t)));
      toast({ title: "Transfer Updated" });
    } else {
      const newTransfer: StockTransfer = {
        id: `trans_${Date.now()}`,
        status: 'Pending',
        ...data,
      };
      setTransfers([newTransfer, ...transfers]);
      toast({ title: "Transfer Created" });
    }
    handleCloseModal();
  };

  const handleDeleteTransfer = (transferId: string) => {
    setTransfers(transfers.filter((t) => t.id !== transferId));
    toast({ title: "Transfer Deleted" });
  };
  
  const updateStatus = (id: string, status: TransferStatus) => {
    setTransfers(transfers.map(t => t.id === id ? { ...t, status } : t));
    toast({ title: `Transfer marked as ${status}`});
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
              <CardTitle>Stock Transfers</CardTitle>
              <CardDescription>
                Move inventory between your warehouses and stores.
              </CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by ID or location..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Transfer
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
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransfers.length > 0 ? (
                  paginatedTransfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell>{format(new Date(t.date), "PPP")}</TableCell>
                      <TableCell>{warehouseMap.get(t.fromWarehouseId)}</TableCell>
                      <TableCell>{warehouseMap.get(t.toWarehouseId)}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[t.status].color} className="capitalize">{statusMap[t.status].icon}{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                         <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Info className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">Transferred Items</h4>
                                  {t.notes && <p className="text-sm text-muted-foreground">Notes: {t.notes}</p>}
                                </div>
                                <div className="grid gap-2 text-sm">
                                  {t.items.map((item, index) => {
                                      const details = productMap.get(item.variantId);
                                      return (
                                          <div key={index} className="grid grid-cols-2 items-center gap-2 border-b pb-2 last:border-b-0">
                                              <span className="col-span-2 font-semibold">{details?.product.name} ({details?.variant.name})</span>
                                              <span>Qty: {item.quantity}</span>
                                          </div>
                                      )
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
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
                            {t.status === 'Pending' && <DropdownMenuItem onClick={() => updateStatus(t.id, 'In Transit')}><Truck className="mr-2 h-4 w-4"/>Mark as In Transit</DropdownMenuItem>}
                            {t.status === 'In Transit' && <DropdownMenuItem onClick={() => updateStatus(t.id, 'Completed')}><CheckCircle className="mr-2 h-4 w-4"/>Mark as Completed</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => handleOpenModal(t)} disabled={t.status !== 'Pending'}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteTransfer(t.id)} className="text-destructive"><Trash className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No transfers found.
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
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransfer ? "Edit Stock Transfer" : "New Stock Transfer"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                 <FormField control={form.control} name="fromWarehouseId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Warehouse</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                           <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="text-center pt-6"><ArrowRight className="h-5 w-5 mx-auto text-muted-foreground" /></div>
                 <FormField control={form.control} name="toWarehouseId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Warehouse</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger></FormControl>
                           <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
              </div>
               <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Transfer</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
              <div className="space-y-4">
                <FormLabel>Items to Transfer</FormLabel>
                {fields.map((field, index) => {
                   const selectedProductId = watchedItems.items[index]?.productId;
                   const availableVariants = products.find(p => p.id === selectedProductId)?.variants || [];
                   return (
                     <div key={field.id} className="grid grid-cols-[2fr,1fr,1fr,auto] items-end gap-2 p-3 border rounded-md">
                       <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Product</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger></FormControl><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`items.${index}.variantId`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Variant</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProductId}><FormControl><SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger></FormControl><SelectContent>{availableVariants.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Quantity</FormLabel><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                   );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", variantId: "", quantity: 1 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any notes about the transfer..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Transfer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
