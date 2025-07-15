
"use client";

import { useState } from 'react';
import type { OrderItem, Product, Category, Brand, Unit, Sale, Customer, ProductVariant } from '@/types';
import { initialProducts, initialCategories, initialBrands, initialUnits, initialSales, initialCustomers } from '@/lib/data';
import { ProductCatalog } from '@/components/pos/ProductCatalog';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { ReceiptModal, ReceiptData } from '@/components/pos/ReceiptModal';
import { PaymentModal, PaymentDetails } from '@/components/pos/PaymentModal';
import { ProductModal, ProductFormData } from '@/components/pos/ProductModal';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';


export default function PosPage() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [heldOrders, setHeldOrders] = useState<{ id: number, items: OrderItem[], customer: Customer | null }[]>([]);
  const [completedSales, setCompletedSales] = useState<Sale[]>(initialSales);

  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ReceiptData | null>(null);

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddToOrder = (product: Product, variant: ProductVariant) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.variant.id === variant.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { 
        productId: product.id,
        productName: product.name,
        variant: variant,
        quantity: 1,
        imageUrl: product.imageUrl,
       }];
    });
  };

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    setOrderItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.variant.id !== variantId);
      }
      return prevItems.map((item) =>
        item.variant.id === variantId ? { ...item, quantity } : item
      );
    });
  };

  const handleRemoveItem = (variantId: string) => {
    setOrderItems((prevItems) => prevItems.filter((item) => item.variant.id !== variantId));
  };
  
  const calculateTotal = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleOpenPayment = () => {
    if (orderItems.length > 0) {
      setPaymentModalOpen(true);
    }
  };

  const handleHoldOrder = () => {
    if (orderItems.length === 0) return;
    setHeldOrders(prev => [...prev, { id: Date.now(), items: orderItems, customer: currentCustomer }]);
    setOrderItems([]);
    setCurrentCustomer(null);
  };

  const handleResumeOrder = (orderId: number) => {
    const orderToResume = heldOrders.find(o => o.id === orderId);
    if (orderToResume) {
      setOrderItems(orderToResume.items);
      setCurrentCustomer(orderToResume.customer);
      setHeldOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };
  
  const handleDeleteHeldOrder = (orderId: number) => {
     setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  }

  const handleFinalizeOrder = (paymentDetails: PaymentDetails) => {
    if (orderItems.length === 0) return;
    const { subtotal, tax, total } = calculateTotal(orderItems);

    const newSale: Sale = {
        id: `sale_${Date.now()}`,
        date: new Date().toISOString(),
        items: orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variant.id,
            variantName: item.variant.name,
            quantity: item.quantity,
            price: item.variant.price,
        })),
        total,
        paymentMethod: paymentDetails.method,
        customerId: currentCustomer?.id,
        customerName: currentCustomer?.name || 'Walk-in Customer',
    };
    setCompletedSales(prev => [newSale, ...prev]);

    setCompletedOrder({
      items: [...orderItems],
      subtotal,
      tax,
      total,
      cashierName: user?.name || 'N/A',
      customerName: currentCustomer?.name || 'Walk-in Customer',
      storeName: settings.storeName,
      headerText: settings.receiptHeaderText || '',
      footerText: settings.receiptFooterText || '',
      paymentMethod: paymentDetails.method,
      amountPaid: paymentDetails.amountPaid,
      change: paymentDetails.change
    });

    setPaymentModalOpen(false);
    setReceiptOpen(true);
  };

  const handleNewOrder = () => {
    setOrderItems([]);
    setCurrentCustomer(null);
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
    setOrderItems(orderItems.filter(item => item.productId !== productId));
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

    const variants = productData.variants.map((v, i) => ({
      ...v,
      id: v.id || `${productData.name.replace(/\s+/g, '-')}-${i}`
    }));

    if (editingProduct) {
      // Edit existing product
      const updatedProduct: Product = { ...editingProduct, ...restData, imageUrl, variants };
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
    } else {
      // Add new product
      const newProduct: Product = {
        ...restData,
        id: `prod_${Date.now()}`,
        imageUrl: imageUrl,
        variants,
      };
      setProducts([newProduct, ...products]);
    }
  };
  
  const productModalData = editingProduct;
  const currentOrderTotal = calculateTotal(orderItems).total;

  return (
    <div className="flex flex-col h-full">
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
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
             <div className="h-full">
                 <OrderPanel
                    orderItems={orderItems}
                    heldOrders={heldOrders}
                    recentSales={completedSales}
                    customers={customers}
                    currentCustomer={currentCustomer}
                    onSetCustomer={setCurrentCustomer}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onFinalize={handleOpenPayment}
                    onHold={handleHoldOrder}
                    onResumeOrder={handleResumeOrder}
                    onDeleteHeldOrder={handleDeleteHeldOrder}
                />
            </div>
        </div>
        <ReceiptModal
            isOpen={isReceiptOpen}
            onClose={handleNewOrder}
            receipt={completedOrder}
        />
         <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            onConfirm={handleFinalizeOrder}
            totalAmount={currentOrderTotal}
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
