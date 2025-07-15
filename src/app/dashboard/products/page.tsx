
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Product, Category, Brand, Unit, ProductVariant } from '@/types';
import { initialProducts, initialCategories, initialBrands, initialUnits } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ProductCatalog } from '@/components/pos/ProductCatalog';
import { ProductModal, ProductFormData } from '@/components/pos/ProductModal';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [brands] = useState<Brand[]>(initialBrands);
  const [units] = useState<Unit[]>(initialUnits);
  
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  
  useEffect(() => {
    if (!loading && !hasPermission('products:read')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [loading, hasPermission, router, toast]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };
  
  const handleDeleteProduct = (productId: string) => {
    if (!hasPermission('products:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleSaveProduct = async (productData: ProductFormData) => {
    if (!hasPermission('products:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
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
      id: v.id || `${restData.name.replace(/\s+/g, '-')}-${i}`
    }));

    if (editingProduct) {
      const updatedProduct: Product = { 
          ...editingProduct, 
          ...restData, 
          variants,
          imageUrl 
        };
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      toast({ title: "Product Updated" });
    } else {
      const newProduct: Product = {
        ...restData,
        id: `prod_${Date.now()}`,
        imageUrl: imageUrl,
        variants
      };
      setProducts([newProduct, ...products]);
      toast({ title: "Product Added" });
    }
  };
  
  if (loading || !hasPermission('products:read')) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-full">
        <ProductCatalog 
            products={products}
            categories={categories}
            brands={brands}
            units={units}
            onAddToOrder={() => {}} // Not used in this context
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            isManagementView={true}
        />
        <ProductModal
            isOpen={isProductModalOpen}
            onClose={() => setProductModalOpen(false)}
            onSave={handleSaveProduct}
            product={editingProduct}
            categories={categories}
            brands={brands}
            units={units}
        />
    </div>
  );
}
