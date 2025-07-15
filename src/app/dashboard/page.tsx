
"use client";

import { useState } from 'react';
import type { OrderItem, Product, Category, Brand, Unit } from '@/types';
import { initialProducts, initialCategories, initialBrands, initialUnits } from '@/lib/data';
import { ProductCatalog } from '@/components/pos/ProductCatalog';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { ReceiptModal, ReceiptData } from '@/components/pos/ReceiptModal';
import { ProductModal, ProductFormData } from '@/components/pos/ProductModal';
import { useAuth } from '@/context/AuthContext';


export default function PosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [units, setUnits] = useState<Unit[]>(initialUnits);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ReceiptData | null>(null);

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
      if (quantity <= 0) {
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
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleFinalizeOrder = () => {
    if (orderItems.length === 0) return;
    const { subtotal, tax, total } = calculateTotal();

    // In a real app, you'd fetch this from your global settings state/context
    const settings = {
        storeName: 'Cashy POS',
        receiptHeaderText: 'Thank you for your purchase!',
        receiptFooterText: 'Please come again!',
    }

    setCompletedOrder({
      items: [...orderItems],
      subtotal,
      tax,
      total,
      cashierName: user?.name || 'N/A',
      storeName: settings.storeName,
      headerText: settings.receiptHeaderText,
      footerText: settings.receiptFooterText,
    });
    setReceiptOpen(true);
  };

  const handleNewOrder = () => {
    setOrderItems([]);
    setReceiptOpen(false);
    setCompletedOrder(null);
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

  const handleSaveProduct = async (productData: ProductFormData) => {
    const { imageFile, ...restData } = productData;
    let imageUrl = editingProduct?.imageUrl || "https://placehold.co/300x300.png";

    if (imageFile && imageFile.length > 0) {
        const file = imageFile[0];
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    if (editingProduct) {
      // Edit existing product
      const updatedProduct = { ...editingProduct, ...restData, imageUrl };
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
    } else {
      // Add new product
      const newProduct: Product = {
        ...restData,
        id: `prod_${Date.now()}`,
        imageUrl: imageUrl,
      };
      setProducts([newProduct, ...products]);
    }
  };
  
  const productModalData = editingProduct;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4">
            <ProductCatalog 
                products={products}
                categories={categories}
                brands={brands}
                units={units}
                onAddToOrder={handleAddToOrder} 
                onAddProduct={handleOpenAddProduct}
                onEditProduct={handleOpenEditProduct}
                onDeleteProduct={handleDeleteProduct}
            />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight hidden lg:block">Current Order</h2>
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
        receipt={completedOrder}
      />
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={productModalData}
        categories={categories}
        brands={brands}
        units={units}
      />
    </div>
  );
}
