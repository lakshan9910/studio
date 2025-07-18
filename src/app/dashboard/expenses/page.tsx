
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { initialExpenses, initialExpenseCategories } from "@/lib/data";
import type { Expense, ExpenseCategory } from "@/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required."),
  categoryId: z.string().min(1, { message: "Category is required." }),
  description: z.string().min(3, { message: "Description must be at least 3 characters." }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be a positive number." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const ROWS_PER_PAGE = 10;

export default function ExpensesPage() {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [expenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const categoryMap = useMemo(() => new Map(expenseCategories.map(cat => [cat.id, cat.name])), [expenseCategories]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd'), categoryId: "", description: "", amount: 0 },
  });

  useEffect(() => {
    if (!loading && !hasPermission('expenses:read')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard');
    }
  }, [loading, hasPermission, router, toast]);

  const filteredExpenses = useMemo(() => {
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    return expenses.filter(expense =>
      expense.description.toLowerCase().includes(lowercasedTerm) ||
      categoryMap.get(expense.categoryId)?.toLowerCase().includes(lowercasedTerm)
    );
  }, [expenses, debouncedSearchTerm, categoryMap]);
  
  const totalPages = Math.ceil(filteredExpenses.length / ROWS_PER_PAGE);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);


  const handleOpenModal = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.reset({
        ...expense,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
      });
    } else {
      form.reset({ date: format(new Date(), 'yyyy-MM-dd'), categoryId: "", description: "", amount: 0 });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
    form.reset({ date: format(new Date(), 'yyyy-MM-dd'), categoryId: "", description: "", amount: 0 });
  };

  const onSubmit = (data: ExpenseFormValues) => {
    if (!hasPermission('expenses:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    if (editingExpense) {
      setExpenses(
        expenses.map((e) =>
          e.id === editingExpense.id ? { ...editingExpense, ...data } : e
        )
      );
      toast({ title: "Expense Updated" });
    } else {
      const newExpense: Expense = {
        id: `exp_${Date.now()}`,
        ...data,
      };
      setExpenses([...expenses, newExpense]);
      toast({ title: "Expense Added" });
    }
    handleCloseModal();
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!hasPermission('expenses:write')) {
      toast({ variant: 'destructive', title: 'Permission Denied'});
      return;
    }
    setExpenses(expenses.filter((e) => e.id !== expenseId));
    toast({ title: "Expense Deleted" });
  };
  
  if (loading || !hasPermission('expenses:read')) {
    return null;
  }
  
  const canWrite = hasPermission('expenses:write');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                Manage your business expenses here.
              </CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search expenses..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => handleOpenModal()} disabled={!canWrite}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.length > 0 ? (
                  paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "PPP")}</TableCell>
                      <TableCell>{categoryMap.get(expense.categoryId) || 'Uncategorized'}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>${expense.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(expense)} disabled={!canWrite}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteExpense(expense.id)}
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
                    <TableCell colSpan={5} className="h-24 text-center">
                      No expenses found.
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

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update the details of the expense." : "Create a new expense record."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an expense category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {expenseCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monthly electricity bill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 125.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canWrite}>Save Expense</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
