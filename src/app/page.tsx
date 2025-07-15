"use client";

import { useState } from 'react';
import type { OrderItem, Product } from '@/types';
import { Header } from '@/components/pos/Header';
import { ProductCatalog } from '@/components/pos/ProductCatalog';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { Toaster } from "@/components/ui/toaster";

export default function PosPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderItem[]>([]);
  const [completedTotal, setCompletedTotal] = useState(0);

  const handleAddToOrder = (product: Product) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setOrderItems((prevItems) => {
      if (quantity === 0) {
        return prevItems.filter((item) => item.id !== productId);
      }
      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };
  
  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax
    return subtotal + tax;
  };

  const handleFinalizeOrder = () => {
    if (orderItems.length === 0) return;
    setCompletedOrder([...orderItems]);
    setCompletedTotal(calculateTotal());
    setReceiptOpen(true);
  };

  const handleNewOrder = () => {
    setOrderItems([]);
    setReceiptOpen(false);
    setCompletedOrder([]);
    setCompletedTotal(0);
  };

  return (
    <div className="flex flex-col h-screen bg-background font-body antialiased">
      <Header />
      <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="h-full max-w-7xl mx-auto grid lg:grid-cols-[2fr,1fr] gap-8">
          <div className="h-full flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
            <div className="flex-1 overflow-hidden">
                <ProductCatalog onAddToOrder={handleAddToOrder} />
            </div>
          </div>
          <div className="h-full flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Current Order</h2>
            <div className="flex-1">
                <OrderPanel
                    items={orderItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onFinalize={handleFinalizeOrder}
                />
            </div>
          </div>
        </div>
      </main>
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleNewOrder}
        orderItems={completedOrder}
        total={completedTotal}
      />
      <Toaster />
    </div>
  );
}
