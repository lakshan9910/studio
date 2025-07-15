
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Search, Plus, LoaderCircle, Frown, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

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
}

export function ProductCatalog({ products: initialProducts, categories, brands, units, onAddToOrder, onAddProduct, onEditProduct, onDeleteProduct }: ProductCatalogProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAiLoading, startAiTransition] = useTransition();
  const { toast } = useToast();

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const brandMap = new Map(brands.map(b => [b.id, b.name]));
  const unitMap = new Map(units.map(u => [u.id, u.name]));

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
    if (debouncedSearchTerm.length > 2) {
      startAiTransition(async () => {
        try {
          const result = await suggestItemSearchQueries({ partialInput: debouncedSearchTerm });
          setSuggestions(result.suggestedQueries.slice(0, 5));
        } catch (error) {
          console.error("Failed to get suggestions:", error);
        }
      });
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);
  
  const handleAiSearch = async (values: z.infer<typeof formSchema>) => {
    setSuggestions([]);
    startAiTransition(async () => {
      try {
        const result = await searchProductsByDescription({ description: values.query });
        if (result.products && result.products.length > 0) {
            const foundProductNames = result.products.map(p => p.name.toLowerCase());
            const aiFiltered = initialProducts.filter(p => foundProductNames.includes(p.name.toLowerCase()));
            setFilteredProducts(aiFiltered);
        } else {
            toast({
                title: "AI Search",
                description: "No products found with that description.",
            });
        }
      } catch (error) {
        console.error("Failed to search products:", error);
        toast({
            variant: "destructive",
            title: "AI Search Error",
            description: "Could not perform AI search. Displaying local results.",
        });
      }
    });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('query', suggestion);
    handleAiSearch({ query: suggestion });
    setSuggestions([]);
  }

  return (
    <Card className="h-full flex flex-col">
        <CardHeader className="p-4 flex-row items-center justify-between">
            <div className="relative flex-1">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAiSearch)} className="flex gap-2">
                        <FormField
                        control={form.control}
                        name="query"
                        render={({ field }) => (
                            <FormItem className="flex-1 relative">
                                <FormControl>
                                    <Input placeholder="Search products..." {...field} className="pr-10" />
                                </FormControl>
                                <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                                {isAiLoading ? <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" /> : <Search className="h-5 w-5 text-muted-foreground" />}
                                </div>
                            </FormItem>
                        )}
                        />
                         <Button type="submit" disabled={isAiLoading}>
                            AI Search
                        </Button>
                    </form>
                </Form>
                 {suggestions.length > 0 && (
                    <Card className="absolute top-full mt-2 w-full z-10 shadow-lg">
                        <CardContent className="p-2">
                           <p className="text-xs font-semibold text-muted-foreground p-2">Suggestions</p>
                            <ul>
                                {suggestions.map((s, i) => (
                                    <li key={i}>
                                        <Button onClick={() => handleSuggestionClick(s)} variant="ghost" className="w-full justify-start font-normal">
                                            {s}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
             <Button onClick={onAddProduct} className="ml-4">
                <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full">
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <Card key={product.id} className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10 bg-black/20 hover:bg-black/50 text-white hover:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteProduct(product.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <CardContent className="p-0 flex-1 flex flex-col">
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
                            <div className="p-4 flex-1 flex flex-col">
                                <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{brandMap.get(product.brand) || 'Unbranded'}</p>
                                <p className="text-xs text-muted-foreground">{categoryMap.get(product.category) || 'Uncategorized'}</p>
                                <p className="text-lg font-bold mt-2 flex-1">${product.price.toFixed(2)}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2">
                            <Button onClick={() => onAddToOrder(product)} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Add to Order
                            </Button>
                        </CardFooter>
                    </Card>
                    )) : (
                        <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Frown className="w-16 h-16" />
                            <p className="mt-4 text-lg">No products found</p>
                            <p className="text-sm">Try adjusting your search or adding new products.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
      </CardContent>
    </Card>
  );
}
