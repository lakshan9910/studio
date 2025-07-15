
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product, Category, Brand, Unit } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileInput } from '@/components/ui/file-input';
import { Trash2, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required.'),
  name: z.string().min(1, 'Variant name is required.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative.'),
});

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  category: z.string().min(1, { message: 'Please select a category.' }),
  brand: z.string().min(1, { message: 'Please select a brand.' }),
  unit: z.string().min(1, { message: 'Please select a base unit.' }),
  variants: z.array(variantSchema).min(1, 'Product must have at least one variant.'),
  imageUrl: z.string().optional(),
  imageFile: z
    .any()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .optional()
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => void;
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  units: Unit[];
}

export function ProductModal({ isOpen, onClose, onSave, product, categories, brands, units }: ProductModalProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      brand: '',
      unit: '',
      variants: [],
      imageUrl: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  const imageFile = form.watch("imageFile");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [imageFile]);


  useEffect(() => {
    if (isOpen) {
      if (product) {
        form.reset({ ...product });
        setPreview(product.imageUrl);
      } else {
        form.reset({
          name: '',
          category: '',
          brand: '',
          unit: '',
          variants: [{ sku: '', name: 'Default', price: 0, stock: 0 }],
          imageUrl: '',
          imageFile: undefined
        });
        setPreview(null);
      }
    }
  }, [product, form, isOpen]);

  const handleSubmit = (data: ProductFormData) => {
    onSave(data);
    onClose();
  };

  const currentImageUrl = preview || product?.imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of the existing product.' : 'Fill in the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Organic Apples" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Base Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a base unit" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                          </SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                   <div className="flex items-center gap-4">
                    {currentImageUrl ? (
                        <Image src={currentImageUrl} alt="Product preview" width={64} height={64} className="rounded-md object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                        <span className="text-xs">No Image</span>
                      </div>
                    )}
                    <FormControl>
                        <FileInput
                          {...rest}
                          onFileSelect={(files) => onChange(files)}
                        />
                    </FormControl>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
                <FormLabel>Product Variants</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr,1fr,100px,100px,auto] gap-2 items-start p-3 border rounded-lg">
                     <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Variant Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Small" {...field} /></FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.sku`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">SKU</FormLabel>
                            <FormControl><Input placeholder="SKU-001" {...field} /></FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Price</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.stock`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Stock</FormLabel>
                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="self-center pt-6">
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', name: '', price: 0, stock: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                </Button>
                <FormMessage>{form.formState.errors.variants?.root?.message}</FormMessage>
              </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Product</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
