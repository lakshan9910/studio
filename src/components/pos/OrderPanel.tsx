"use client";

import type { OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MinusCircle, PlusCircle, Trash2, ShoppingBag } from 'lucide-react';
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
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <span>Order</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-slate-50 dark:bg-slate-800/20 rounded-lg">
            <ShoppingBag className="w-16 h-16" />
            <p className="mt-4 text-lg font-medium">Your order is empty</p>
            <p className="text-sm">Add products from the catalog to get started.</p>
          </div>
        ) : (
            <ScrollArea className="flex-1 -mx-6">
                <div className="px-6 flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                            <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                            <div className="flex-1">
                                <p className="font-semibold">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => onRemoveItem(item.id)}>
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
        <CardFooter className="flex-col gap-2 !p-6 border-t mt-auto">
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="w-full flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button onClick={onFinalize} size="lg" className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
            Finalize Transaction
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
