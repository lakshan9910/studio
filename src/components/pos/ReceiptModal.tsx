
"use client";

import type { OrderItem, PaymentMethod } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';

export interface ReceiptData {
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    cashierName: string;
    storeName: string;
    headerText: string;
    footerText: string;
    paymentMethod: PaymentMethod;
    amountPaid?: number;
    change?: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
    if (!receipt) return null;

    const handlePrint = () => {
        window.print();
    };

    const { items, subtotal, tax, total, cashierName, storeName, headerText, footerText, paymentMethod, amountPaid, change } = receipt;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md @media print:shadow-none print:border-none">
        <div id="receipt-content">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-xl font-bold">{storeName}</DialogTitle>
              <DialogDescription className="text-xs">{headerText}</DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 p-2 rounded-lg text-xs mb-4">
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{cashierName}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Payment:</span>
                    <span>{paymentMethod}</span>
                </div>
            </div>
            <ScrollArea className="max-h-60">
                <div className="space-y-2 pr-4">
                    {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground text-xs">
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
                 <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                {paymentMethod === 'Cash' && amountPaid && (
                   <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash Paid</span>
                        <span>${amountPaid.toFixed(2)}</span>
                    </div>
                )}
                 {paymentMethod === 'Cash' && change !== undefined && (
                   <div className="flex justify-between">
                        <span className="text-muted-foreground">Change</span>
                        <span>${change.toFixed(2)}</span>
                    </div>
                )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">{footerText}</p>
        </div>
        <DialogFooter className="print:hidden mt-6">
            <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Print Bill
            </Button>
          <Button onClick={onClose} className="w-full sm:w-auto" size="lg">
            Start New Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
