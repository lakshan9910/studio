
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import JsBarcode from 'jsbarcode';
import type { Product, ProductVariant } from "@/types";
import { initialProducts } from "@/lib/data";
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, PlusCircle, MinusCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrintQueueItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

const paperSizes = {
  A4: {
    width: '210mm',
    height: '297mm',
    gap: '4mm',
    labelWidth: '63.5mm',
    labelHeight: '29.6mm',
    cols: 3,
  }
};

type PaperSize = keyof typeof paperSizes;

export default function BarcodePrintingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');

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

  useEffect(() => {
    if (debouncedSearchTerm) {
      const results = products.filter(p =>
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.variants.some(v => v.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, products]);
  
  const barcodesToPrint = useMemo(() => {
    return printQueue.flatMap(item => 
        Array.from({ length: item.quantity }, (_, i) => ({
            ...item,
            uniqueId: `${item.variant.id}-${i}`
        }))
    );
  }, [printQueue]);

  useEffect(() => {
    barcodesToPrint.forEach(item => {
        const element = document.getElementById(item.uniqueId);
         if (element) {
            JsBarcode(element, item.variant.sku, {
                format: "CODE128",
                displayValue: true,
                fontSize: 12,
                textMargin: 0,
                height: 40,
                margin: 4,
            });
        }
    });
  }, [barcodesToPrint]);

  const addToQueue = (product: Product, variant: ProductVariant) => {
    setPrintQueue(prev => {
      const existing = prev.find(item => item.variant.id === variant.id);
      if (existing) {
        return prev.map(item =>
          item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
  };

  const updateQuantity = (variantId: string, newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    setPrintQueue(prev => {
        if (qty === 0) {
            return prev.filter(item => item.variant.id !== variantId);
        }
        return prev.map(item =>
            item.variant.id === variantId ? { ...item, quantity: qty } : item
        );
    });
  };
  
  const removeFromQueue = (variantId: string) => {
    setPrintQueue(prev => prev.filter(item => item.variant.id !== variantId));
  }

  const handlePrint = () => {
    window.print();
  };

  if (user?.role !== 'Admin') {
    return null;
  }

  const currentPaper = paperSizes[paperSize];
  
  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Control Sidebar */}
      <aside className="w-1/3 min-w-[350px] max-w-[450px] border-r flex flex-col bg-card">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Barcode Printing</h2>
          <p className="text-sm text-muted-foreground">Search and add products to the print queue.</p>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <ScrollArea className="flex-grow">
            <div className="p-4 pt-0">
                <h3 className="text-sm font-semibold mb-2">Search Results</h3>
                <div className="space-y-2">
                {searchResults.map(product => (
                    <Card key={product.id} className="p-2">
                        <p className="font-semibold text-sm">{product.name}</p>
                        <div className="space-y-1 mt-1">
                            {product.variants.map(variant => (
                                <div key={variant.id} className="flex items-center justify-between text-xs">
                                    <span>{variant.name} ({variant.sku})</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => addToQueue(product, variant)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
                </div>
            </div>
          </ScrollArea>
        )}

        {/* Print Queue */}
        <div className="p-4 border-t">
          <h3 className="text-lg font-bold mb-2">Print Queue ({printQueue.reduce((acc, item) => acc + item.quantity, 0)})</h3>
          <ScrollArea className="h-48">
            {printQueue.length > 0 ? (
                <div className="space-y-2 pr-2">
                    {printQueue.map(item => (
                        <div key={item.variant.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted">
                            <Image src={item.product.imageUrl} alt={item.product.name} width={32} height={32} className="rounded" />
                            <div className="flex-grow">
                                <p className="font-semibold leading-tight">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                            </div>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateQuantity(item.variant.id, parseInt(e.target.value, 10) || 0)}
                                className="w-16 h-8 text-center"
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromQueue(item.variant.id)}>
                                <XCircle className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Queue is empty.</p>
            )}
          </ScrollArea>
        </div>

        <div className="mt-auto p-4 border-t bg-muted/50">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Paper Size</label>
                    <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A4">A4 (3x7 labels)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handlePrint} className="w-full text-lg h-12" disabled={printQueue.length === 0}>
                    <Printer className="mr-2 h-5 w-5" />
                    Print Labels
                </Button>
            </div>
        </div>
      </aside>

      {/* Barcode Preview */}
      <main className="flex-1 bg-gray-200 p-4 overflow-auto">
        <div 
          id="printable-area" 
          className="bg-white shadow-lg mx-auto" 
          style={{ width: currentPaper.width, minHeight: currentPaper.height}}
        >
            <div 
              className="p-4 grid gap-x-0" 
              style={{
                gridTemplateColumns: `repeat(${currentPaper.cols}, 1fr)`,
                rowGap: currentPaper.gap
              }}
            >
                {barcodesToPrint.map((item) => (
                    <div key={item.uniqueId} 
                         className="barcode-cell text-center flex flex-col items-center justify-center p-1 break-all"
                         style={{ width: currentPaper.labelWidth, height: currentPaper.labelHeight }}
                    >
                        <p className="text-[8px] font-bold truncate w-full">{item.product.name}</p>
                        <p className="text-[7px] truncate w-full">{item.variant.name}</p>
                        <svg id={item.uniqueId} className="w-full h-auto"></svg>
                    </div>
                ))}
            </div>
        </div>
      </main>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}

    