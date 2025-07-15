"use client";

import type { OrderItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  total: number;
}

export function ReceiptModal({ isOpen, onClose, orderItems, total }: ReceiptModalProps) {
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = total - subtotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Transaction Complete</DialogTitle>
          <DialogDescription className="text-center">
            Thank you for your purchase!
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
            <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-center">Receipt</p>
                <p className="text-xs text-muted-foreground text-center">{new Date().toLocaleString()}</p>
            </div>
            <ScrollArea className="max-h-60 mt-4">
                <div className="space-y-2 pr-4">
                    {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground">
                                {item.quantity} x ${item.price.toFixed(2)}
                            </p>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    ))}
                </div>
            </ScrollArea>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full" size="lg">
            Start New Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
