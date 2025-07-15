
"use client";

import { useState, useEffect, useTransition } from 'react';
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Product, Category, Brand, Unit } from '@/types';
import { suggestItemSearchQueries } from '@/ai/flows/suggest-item-search-queries';
import { searchProductsByDescription } from '@/ai/flows/search-products-by-description';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Search, Plus, LoaderCircle, Frown, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  query: z.string(),
});

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  onAddToOrder: (product: Product) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  isManagementView?: boolean;
}

export function ProductCatalog({ products: initialProducts, categories, brands, units, onAddToOrder, onAddProduct, onEditProduct, onDeleteProduct, isManagementView = false }: ProductCatalogProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAiLoading, startAiTransition] = useTransition();
  const { toast } = useToast();

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const brandMap = new Map(brands.map(b => [b.id, b.name]));

  useEffect(() => {
    setFilteredProducts(initialProducts);
  }, [initialProducts]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: "" },
  });

  const searchTerm = form.watch('query');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const performSearch = () => {
        if (debouncedSearchTerm.trim() === '') {
            setFilteredProducts(initialProducts);
            return;
        }

        const query = debouncedSearchTerm.toLowerCase();
        const localFiltered = initialProducts.filter(p => 
            p.name.toLowerCase().includes(query) || 
            categoryMap.get(p.category)?.toLowerCase().includes(query) ||
            brandMap.get(p.brand)?.toLowerCase().includes(query)
        );
        setFilteredProducts(localFiltered);
    };
    performSearch();
  }, [debouncedSearchTerm, initialProducts, categoryMap, brandMap]);

  useEffect(() => {
    if (debouncedSearchTerm.length > 2 && debouncedSearchTerm.length < 50) {
      startAiTransition(async () => {
        try {
          const result = await suggestItemSearchQueries({ partialInput: debouncedSearchTerm });
          setSuggestions(result.suggestedQueries.slice(0, 3));
        } catch (error) {
          console.error("Failed to get suggestions:", error);
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);
  
  const handleAiSearch = async (values: z.infer<typeof formSchema>) => {
    if (!values.query) return;
    setSuggestions([]);
    startAiTransition(async () => {
      try {
        const result = await searchProductsByDescription({ description: values.query });
        if (result.products && result.products.length > 0) {
            const foundProductIds = result.products.map(p => p.id);
            const aiFiltered = initialProducts.filter(p => foundProductIds.includes(p.id));
             setFilteredProducts(aiFiltered);
             if (aiFiltered.length === 0) {
                 toast({
                    title: "AI Search",
                    description: "AI found products but they don't exist in our inventory.",
                });
             }
        } else {
            setFilteredProducts([]);
        }
      } catch (error) {
        console.error("Failed to search products:", error);
        toast({
            variant: "destructive",
            title: "AI Search Error",
            description: "Could not perform AI search. Please try a different query.",
        });
      }
    });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('query', suggestion, { shouldDirty: true });
    setSuggestions([]);
  }

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 flex-row items-center justify-between gap-4 border-b">
            <div className="relative flex-1">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAiSearch)}>
                        <FormField
                        control={form.control}
                        name="query"
                        render={({ field }) => (
                            <FormItem className="flex-1 relative">
                                <FormControl>
                                    <Input placeholder="Search products by name or use AI for descriptions..." {...field} className="pr-10 h-11 text-base" />
                                </FormControl>
                                <Button size="icon" variant="ghost" type="submit" className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8" disabled={isAiLoading}>
                                  {isAiLoading ? <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" /> : <Search className="h-5 w-5 text-muted-foreground" />}
                                </Button>
                            </FormItem>
                        )}
                        />
                    </form>
                </Form>
                 {suggestions.length > 0 && (
                    <Card className="absolute top-full mt-2 w-full z-10 shadow-lg border-primary/20">
                        <CardContent className="p-2">
                           <p className="text-xs font-semibold text-muted-foreground px-2 py-1">AI Suggestions</p>
                            <ul className='flex flex-col gap-1'>
                                {suggestions.map((s, i) => (
                                    <li key={i}>
                                        <Button onClick={() => handleSuggestionClick(s)} variant="ghost" size="sm" className="w-full justify-start font-normal h-auto py-1.5 px-2 text-left">
                                            {s}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
             <Button onClick={onAddProduct} size="lg" className="h-11">
                <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative">
                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full">
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <Card key={product.id} className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative rounded-lg">
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="relative">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8 z-10 bg-black/30 hover:bg-black/60 text-white hover:text-white rounded-full">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDeleteProduct(product.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="aspect-square w-full overflow-hidden">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        width={300}
                                        height={300}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={`${categoryMap.get(product.category)} ${product.name}`}
                                    />
                                </div>
                                <Badge variant="secondary" className="absolute bottom-2 left-2">{categoryMap.get(product.category) || 'Uncategorized'}</Badge>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <CardTitle className="text-base font-bold leading-tight">{product.name}</CardTitle>
                                <p className="text-sm text-muted-foreground flex-1">{brandMap.get(product.brand) || 'Unbranded'}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2 pt-0 flex items-center justify-between">
                             <p className="text-xl font-bold ml-2">${product.price.toFixed(2)}</p>
                            {!isManagementView &&
                                <Button onClick={() => onAddToOrder(product)} className="w-auto font-bold">
                                    <Plus className="mr-2 h-4 w-4" /> Add
                                </Button>
                            }
                        </CardFooter>
                    </Card>
                    )) : (
                        <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Frown className="w-16 h-16" />
                            <p className="mt-4 text-lg font-semibold">No products found</p>
                            <p className="text-sm">Try adjusting your search or adding new products.</p>
                        </div>
                    )}
                </div>
      </CardContent>
    </Card>
  );
}
