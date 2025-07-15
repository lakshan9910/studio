
"use client";

import type { OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from "next/image";

interface OrderPanelProps {
  items: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onFinalize: () => void;
}

export function OrderPanel({ items, onUpdateQuantity, onRemoveItem, onFinalize }: OrderPanelProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-xl">
      <CardHeader className='pb-4'>
        <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5" />
            <span>Current Order</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
            <div className='p-5 bg-muted rounded-full mb-4'>
                <ShoppingBag className="w-10 h-10" />
            </div>
            <p className="mt-2 text-lg font-semibold">Your order is empty</p>
            <p className="text-sm">Add products from the catalog to get started.</p>
          </div>
        ) : (
            <ScrollArea className="flex-1">
                <div className="px-6 flex flex-col gap-5">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                            <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-lg object-cover aspect-square" />
                            <div className="flex-1">
                                <p className="font-semibold leading-tight">{item.name}</p>
                                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <p className="font-bold text-base">${(item.price * item.quantity).toFixed(2)}</p>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => onRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
          </ScrollArea>
        )}
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="flex-col gap-2 !p-6 border-t mt-auto bg-muted/30">
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <Separator className="my-2 bg-border/50" />
          <div className="w-full flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button onClick={onFinalize} size="lg" className="w-full mt-4 text-base font-bold tracking-wide">
            Finalize Transaction
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
