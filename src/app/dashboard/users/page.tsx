
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from '@/context/AuthContext';
import type { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileInput } from "@/components/ui/file-input";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  role: z.enum(["Admin", "Cashier"]),
  password: z.string().optional(),
  imageUrl: z.string().optional(),
  imageFile: z
    .any()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { user: currentUser, users, addUser, updateUser, deleteUser, updateUserPassword, loading } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", phone: "", role: "Cashier", password: "", imageUrl: "" },
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
    if (!loading && currentUser?.role !== 'Admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [currentUser, loading, router, toast]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [users, debouncedSearchTerm]);


  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      form.reset({ name: user.name, email: user.email, phone: user.phone, role: user.role, imageUrl: user.imageUrl, password: "" });
      setPreview(user.imageUrl || null);
    } else {
      form.reset({ name: "", email: "", phone: "", role: "Cashier", password: "", imageUrl: "" });
      setPreview(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    form.reset({ name: "", email: "", phone: "", role: "Cashier", password: "", imageUrl: "" });
    setPreview(null);
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      let imageUrl = editingUser?.imageUrl;
      if (data.imageFile && data.imageFile.length > 0) {
        const file = data.imageFile[0];
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
      }

      if (editingUser) {
        await updateUser(editingUser.id, { name: data.name, role: data.role, phone: data.phone, imageUrl });
        if (data.password) {
            await updateUserPassword(editingUser.id, data.password);
        }
        toast({ title: "Success", description: "User updated successfully." });
      } else {
        if (!data.password || data.password.length < 6) {
            form.setError("password", { message: "Password is required and must be at least 6 characters." });
            return;
        }
        await addUser(data.name!, data.email, data.password, data.role, data.phone, imageUrl);
        toast({ title: "Success", description: "User created successfully." });
      }
      handleCloseModal();
    } catch (error: any) {
        form.setError("root", { message: error.message });
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
        toast({ variant: "destructive", title: "Error", description: "You cannot delete your own account."});
        return;
    }
    try {
        await deleteUser(userId);
        toast({ title: "Success", description: "User deleted successfully."});
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };
  
  if (currentUser?.role !== 'Admin') {
    return null;
  }
  
  const currentImageUrl = preview || editingUser?.imageUrl;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts and roles.</CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search users by name or email..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.imageUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                                <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                            <Edit className="mr-2 h-4 w-4" /> <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>{editingUser ? "Update user details." : "Create a new user account."}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g., John Doe" {...field} value={field.value || ''}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="user@example.com" {...field} disabled={!!editingUser} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., 123-456-7890" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder={editingUser ? "Leave blank to keep current password" : "••••••••"} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Cashier">Cashier</SelectItem>
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
                      <FormLabel>User Photo</FormLabel>
                       <div className="flex items-center gap-4">
                        {currentImageUrl ? (
                            <Image src={currentImageUrl} alt="User preview" width={64} height={64} className="rounded-full object-cover" />
                        ) : (
                            <Avatar>
                                <AvatarFallback>{form.getValues().name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
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
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
