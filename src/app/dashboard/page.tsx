
"use client";

import { useState } from 'react';
import type { OrderItem, Product, Category } from '@/types';
import { initialProducts } from '@/lib/data';
import { initialCategories } from '@/lib/data';
import { ProductCatalog } from '@/components/pos/ProductCatalog';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { ProductModal, ProductFormData } from '@/components/pos/ProductModal';

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderItem[]>([]);
  const [completedTotal, setCompletedTotal] = useState(0);

  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };
  
  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    setOrderItems(orderItems.filter(item => item.id !== productId));
  };

  const handleSaveProduct = (productData: ProductFormData) => {
    if (editingProduct) {
      // Edit existing product
      const updatedProduct = { ...editingProduct, ...productData };
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
    } else {
      // Add new product
      const newProduct: Product = {
        ...productData,
        id: `prod_${Date.now()}`,
        imageUrl: 'https://placehold.co/300x300.png',
      };
      setProducts([...products, newProduct]);
    }
  };
  
  const productModalData = editingProduct ? 
    { name: editingProduct.name, category: editingProduct.category, price: editingProduct.price, stock: editingProduct.stock } : 
    null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background font-body antialiased">
      <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="h-full max-w-7xl mx-auto grid lg:grid-cols-[2fr,1fr] gap-8">
          <div className="h-full flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <ProductCatalog 
                    products={products}
                    categories={categories}
                    onAddToOrder={handleAddToOrder} 
                    onAddProduct={handleOpenAddProduct}
                    onEditProduct={handleOpenEditProduct}
                    onDeleteProduct={handleDeleteProduct}
                />
            </div>
          </div>
          <div className="h-full flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight sr-only">Current Order</h2>
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
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={productModalData}
        categories={categories}
      />
    </div>
  );
}
