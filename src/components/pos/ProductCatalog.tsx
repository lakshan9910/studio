"use client";

import { useState, useEffect, useTransition } from 'react';
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Product } from '@/types';
import { products as allProducts } from '@/lib/data';
import { suggestItemSearchQueries } from '@/ai/flows/suggest-item-search-queries';
import { searchProductsByDescription } from '@/ai/flows/search-products-by-description';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Search, Plus, LoaderCircle, Frown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  query: z.string(),
});

interface ProductCatalogProps {
  onAddToOrder: (product: Product) => void;
}

export function ProductCatalog({ onAddToOrder }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>(allProducts);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAiLoading, startAiTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: "" },
  });

  const searchTerm = form.watch('query');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    setSuggestions([]);
    startAiTransition(async () => {
        if(values.query.trim() === '') {
            setProducts(allProducts);
            return;
        }

      try {
        const result = await searchProductsByDescription({ description: values.query });
        if (result.products && result.products.length > 0) {
            // This assumes the AI returns products that can be matched to our mock data by name.
            // In a real app, the AI would likely return IDs we can use to fetch from a DB.
            const foundProducts = allProducts.filter(p => result.products.some(rp => rp.name.toLowerCase() === p.name.toLowerCase()));
            setProducts(foundProducts.length > 0 ? foundProducts : allProducts.filter(p => p.name.toLowerCase().includes(values.query.toLowerCase())));
        } else {
           setProducts(allProducts.filter(p => p.name.toLowerCase().includes(values.query.toLowerCase())));
        }
      } catch (error) {
        console.error("Failed to search products:", error);
        toast({
            variant: "destructive",
            title: "Search Error",
            description: "Could not perform AI search. Falling back to local search.",
        });
        // Fallback to simple local search
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(values.query.toLowerCase()));
        setProducts(filtered);
      }
    });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('query', suggestion);
    handleSearch({ query: suggestion });
    setSuggestions([]);
  }

  return (
    <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col gap-4">
            <div className="relative">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSearch)} className="flex gap-2">
                        <FormField
                        control={form.control}
                        name="query"
                        render={({ field }) => (
                            <FormItem className="flex-1 relative">
                                <FormControl>
                                    <Input placeholder="Search for products or describe an item..." {...field} className="pr-10" />
                                </FormControl>
                                <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                                {isAiLoading ? <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" /> : <Search className="h-5 w-5 text-muted-foreground" />}
                                </div>
                            </FormItem>
                        )}
                        />
                         <Button type="submit" disabled={isAiLoading}>
                            Search
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

            <ScrollArea className="flex-1 -m-4">
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.length > 0 ? products.map((product) => (
                    <Card key={product.id} className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="aspect-square w-full overflow-hidden">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    width={300}
                                    height={300}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={`${product.category} ${product.name}`}
                                />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{product.category}</p>
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
                        </div>
                    )}
                </div>
            </ScrollArea>
      </CardContent>
    </Card>
  );
}
