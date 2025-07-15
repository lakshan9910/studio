
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialBrands } from "@/lib/data";
import type { Brand } from "@/types";
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MoreHorizontal, PlusCircle, Trash, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { FileInput } from "@/components/ui/file-input";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const brandSchema = z.object({
  name: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
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

type BrandFormValues = z.infer<typeof brandSchema>;

const ROWS_PER_PAGE = 10;

export default function BrandsPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "" , imageUrl: ""},
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
    if (!loading && !hasPermission('products:read')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [loading, hasPermission, router, toast]);

  const filteredBrands = useMemo(() => {
    return brands.filter(brand =>
      brand.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [brands, debouncedSearchTerm]);
  
  const totalPages = Math.ceil(filteredBrands.length / ROWS_PER_PAGE);

  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredBrands.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredBrands, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleOpenModal = (brand: Brand | null = null) => {
    setEditingBrand(brand);
    if (brand) {
      form.reset({ name: brand.name, imageUrl: brand.imageUrl });
      setPreview(brand.imageUrl);
    } else {
      form.reset({ name: "", imageUrl: "" });
      setPreview(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
    form.reset({ name: "", imageUrl: "" });
    setPreview(null);
  };

  const onSubmit = async (data: BrandFormValues) => {
    if (!hasPermission('products:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    let imageData = editingBrand?.imageUrl || "https://placehold.co/200x200.png";
    if (data.imageFile && data.imageFile.length > 0) {
        const file = data.imageFile[0];
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    if (editingBrand) {
      setBrands(
        brands.map((b) =>
          b.id === editingBrand.id ? { ...b, name: data.name, imageUrl: imageData } : b
        )
      );
      toast({ title: "Brand Updated", description: "The brand has been successfully updated." });
    } else {
      const newBrand: Brand = {
        id: `brand_${Date.now()}`,
        name: data.name,
        imageUrl: imageData,
      };
      setBrands([...brands, newBrand]);
      toast({ title: "Brand Added", description: "A new brand has been successfully added." });
    }
    handleCloseModal();
  };

  const handleDeleteBrand = (brandId: string) => {
    if (!hasPermission('products:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    setBrands(brands.filter((b) => b.id !== brandId));
    toast({ title: "Brand Deleted", description: "The brand has been successfully deleted." });
  };
  
  if (loading || !hasPermission('products:read')) {
    return null;
  }

  const canWrite = hasPermission('products:write');
  const currentImageUrl = preview || editingBrand?.imageUrl;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto backdrop-blur-lg bg-white/50 dark:bg-black/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
             <div className="flex-1">
              <CardTitle>Brands</CardTitle>
              <CardDescription>
                Manage your product brands here.
              </CardDescription>
            </div>
             <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search brands..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()} disabled={!canWrite}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBrands.length > 0 ? (
                  paginatedBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <Image src={brand.imageUrl} alt={brand.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint={`${brand.name} logo`}/>
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(brand)} disabled={!canWrite}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteBrand(brand.id)}
                              className="text-destructive"
                              disabled={!canWrite}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No brands found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
         <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription>
              {editingBrand
                ? "Update the name of the brand."
                : "Create a new brand for your products."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FarmFresh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="imageFile"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Brand Image</FormLabel>
                       <div className="flex items-center gap-4">
                        {currentImageUrl && (
                            <Image src={currentImageUrl} alt="Brand preview" width={64} height={64} className="rounded-md object-cover" />
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canWrite}>Save Brand</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
