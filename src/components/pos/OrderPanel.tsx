
"use client";

import { useState } from 'react';
import type { OrderItem, Sale, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ListRestart, History, Hand, Receipt, User, X } from 'lucide-react';
import Image from "next/image";
import { useSettings } from '@/context/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';


interface OrderPanelProps {
  orderItems: OrderItem[];
  heldOrders: { id: number, items: OrderItem[], customer: Customer | null }[];
  recentSales: Sale[];
  customers: Customer[];
  currentCustomer: Customer | null;
  onSetCustomer: (customer: Customer | null) => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
  onFinalize: () => void;
  onHold: () => void;
  onResumeOrder: (orderId: number) => void;
  onDeleteHeldOrder: (orderId: number) => void;
}

function CurrentOrderView({ orderItems, customers, currentCustomer, onSetCustomer, onUpdateQuantity, onRemoveItem, onFinalize, onHold, t }: any) {
    const subtotal = orderItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const [openCustomerPopover, setOpenCustomerPopover] = useState(false);

    return (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {orderItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <div className='p-5 bg-muted rounded-full mb-4'>
                    <ShoppingBag className="w-10 h-10" />
                </div>
                <p className="mt-2 text-lg font-semibold">{t('order_is_empty')}</p>
                <p className="text-sm">{t('add_products_to_start')}</p>
            </div>
            ) : (
                <>
                <div className="px-6 flex items-center gap-2">
                    <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <User className="mr-2 h-4 w-4" />
                                {currentCustomer ? currentCustomer.name : "Select Customer"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search customer..." />
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                <ScrollArea className="h-48">
                                    {customers.map((customer: Customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.name}
                                            onSelect={() => {
                                                onSetCustomer(customer);
                                                setOpenCustomerPopover(false);
                                            }}
                                        >
                                            {customer.name}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {currentCustomer && (
                        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => onSetCustomer(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <ScrollArea className="flex-1">
                    <div className="px-6 flex flex-col gap-5">
                        {orderItems.map((item) => (
                            <div key={item.variant.id} className="flex items-start gap-4">
                                <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="rounded-lg object-cover aspect-square" />
                                <div className="flex-1">
                                    <p className="font-semibold leading-tight">{item.productName}</p>
                                    <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                                    <p className="text-sm text-muted-foreground">${item.variant.price.toFixed(2)}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.variant.id, item.quantity - 1)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.variant.id, item.quantity + 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="font-bold text-base">${(item.variant.price * item.quantity).toFixed(2)}</p>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => onRemoveItem(item.variant.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                </>
            )}
            {orderItems.length > 0 && (
                <CardFooter className="flex-col gap-2 !p-6 border-t mt-auto bg-muted/30">
                <div className="w-full flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="w-full flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('tax')} (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2 bg-border/50" />
                <div className="w-full flex justify-between text-lg font-bold">
                    <span>{t('total')}</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                 <div className="w-full grid grid-cols-2 gap-2 mt-4">
                    <Button onClick={onHold} variant="outline" className="font-bold tracking-wide">
                        <Hand className="mr-2 h-4 w-4" /> Hold
                    </Button>
                    <Button onClick={onFinalize} size="lg" className="text-base font-bold tracking-wide">
                        Payment
                    </Button>
                 </div>
                </CardFooter>
            )}
        </div>
    );
}

function HeldOrdersView({ heldOrders, onResumeOrder, onDeleteHeldOrder }: any) {
    const calculateTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0) * 1.08;
    };

    return (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {heldOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <Hand className="w-10 h-10 mb-4" />
                    <p className="text-lg font-semibold">No Held Orders</p>
                    <p className="text-sm">You can hold an order to save it for later.</p>
                </div>
            ) : (
                <ScrollArea>
                    <div className="px-6 flex flex-col gap-3">
                        {heldOrders.map((order: any) => (
                            <div key={order.id} className="border p-3 rounded-lg flex items-center justify-between gap-2">
                                <div className="flex-1">
                                    <p className="font-semibold">{order.items.length} items for {order.customer?.name || 'Walk-in'}</p>
                                    <p className="text-sm text-muted-foreground">Total: ${calculateTotal(order.items).toFixed(2)}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => onResumeOrder(order.id)}>
                                    <ListRestart className="mr-2 h-4 w-4" /> Resume
                                </Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDeleteHeldOrder(order.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

function RecentSalesView({ recentSales }: { recentSales: Sale[] }) {
    return (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {recentSales.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <Receipt className="w-10 h-10 mb-4" />
                    <p className="text-lg font-semibold">No Recent Sales</p>
                    <p className="text-sm">Completed sales will appear here.</p>
                </div>
            ) : (
                <ScrollArea>
                    <div className="px-6 flex flex-col gap-3">
                        {recentSales.map((sale) => (
                             <div key={sale.id} className="border p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-sm">Sale ID: <span className="font-mono text-xs">{sale.id.slice(-6)}</span></p>
                                        <p className="text-xs text-muted-foreground">To: {sale.customerName}</p>
                                    </div>
                                    <p className="font-bold text-lg">${sale.total.toFixed(2)}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{format(new Date(sale.date), "PPP p")}</p>
                                <Separator className="my-2" />
                                <ul className="text-xs space-y-1">
                                    {sale.items.map(item => (
                                        <li key={item.variantId} className="flex justify-between">
                                            <span>{item.productName} ({item.variantName}) x{item.quantity}</span>
                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    )
}

export function OrderPanel({ orderItems, heldOrders, recentSales, customers, currentCustomer, onSetCustomer, onUpdateQuantity, onRemoveItem, onFinalize, onHold, onResumeOrder, onDeleteHeldOrder }: OrderPanelProps) {
  const { t } = useSettings();

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-xl">
      <CardHeader className='pb-4'>
        <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5" />
            <span>{t('current_order')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <Tabs defaultValue="current" className="h-full flex flex-col">
            <TabsList className="mx-6">
                <TabsTrigger value="current" className="w-full flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" /> Current
                </TabsTrigger>
                <TabsTrigger value="held" className="w-full flex items-center gap-2">
                    <Hand className="h-4 w-4" /> Held ({heldOrders.length})
                </TabsTrigger>
                 <TabsTrigger value="recent" className="w-full flex items-center gap-2">
                    <History className="h-4 w-4" /> Recent
                </TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="flex-1 flex flex-col mt-4 data-[state=inactive]:hidden">
                <CurrentOrderView 
                    orderItems={orderItems} 
                    customers={customers}
                    currentCustomer={currentCustomer}
                    onSetCustomer={onSetCustomer}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    onFinalize={onFinalize}
                    onHold={onHold}
                    t={t} 
                />
            </TabsContent>
            <TabsContent value="held" className="flex-1 flex flex-col mt-4 data-[state=inactive]:hidden">
                <HeldOrdersView 
                    heldOrders={heldOrders}
                    onResumeOrder={onResumeOrder}
                    onDeleteHeldOrder={onDeleteHeldOrder}
                />
            </TabsContent>
            <TabsContent value="recent" className="flex-1 flex flex-col mt-4 data-[state=inactive]:hidden">
                 <RecentSalesView recentSales={recentSales} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
