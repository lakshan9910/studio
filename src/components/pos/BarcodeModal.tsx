
"use client";

import { useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import type { Product } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function BarcodeModal({ isOpen, onClose, product }: BarcodeModalProps) {

    useEffect(() => {
        if (isOpen && product) {
            product.variants.forEach(variant => {
                if(variant.sku) {
                     JsBarcode(`#barcode-${variant.id}`, variant.sku, {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 14,
                        margin: 10,
                     });
                }
            });
        }
    }, [isOpen, product]);
    
    if (!product) return null;

    const handlePrint = () => {
        window.print();
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div id="barcode-content">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-xl font-bold">{product.name} - Barcodes</DialogTitle>
              <DialogDescription>Print these barcodes to use with a scanner.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                {product.variants.map((variant) => (
                    <div key={variant.id} className="text-center p-4 border rounded-lg flex flex-col items-center justify-center">
                        <p className="font-semibold">{variant.name}</p>
                        <p className="text-sm text-muted-foreground">${variant.price.toFixed(2)}</p>
                        {variant.sku ? (
                             <svg id={`barcode-${variant.id}`} className="mt-2"></svg>
                        ) : (
                            <p className="text-xs text-destructive mt-2">No SKU provided for this variant.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
        <DialogFooter className="print:hidden mt-6">
            <Button onClick={onClose} variant="outline">
                Close
            </Button>
            <Button onClick={handlePrint} className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Print Barcodes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
