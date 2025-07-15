
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Loan, LoanRepayment, LoanStatus } from "@/types";
import { initialLoans } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MoreHorizontal, PlusCircle, Trash, Edit, Search, HandCoins, CheckCircle, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const loanSchema = z.object({
    userId: z.string().min(1, "Employee is required."),
    amount: z.coerce.number().min(1, "Amount must be greater than 0."),
    reason: z.string().min(3, "A reason for the loan is required."),
    issueDate: z.string().min(1, "Issue date is required."),
    monthlyInstallment: z.coerce.number().min(1, "Installment must be greater than 0."),
});

type LoanFormValues = z.infer<typeof loanSchema>;

const ROWS_PER_PAGE = 10;

const statusMap: { [key in LoanStatus]: { color: "default" | "secondary", icon: React.ReactNode } } = {
  Active: { color: "secondary", icon: <Clock className="mr-1 h-3 w-3"/> },
  'Paid Off': { color: "default", icon: <CheckCircle className="mr-1 h-3 w-3"/> },
};

export default function LoansPage() {
    const { users, loading, hasPermission } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [loans, setLoans] = useState<Loan[]>(initialLoans);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [currentPage, setCurrentPage] = useState(1);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const form = useForm<LoanFormValues>({
        resolver: zodResolver(loanSchema),
        defaultValues: {
            userId: "",
            amount: 0,
            reason: "",
            issueDate: format(new Date(), 'yyyy-MM-dd'),
            monthlyInstallment: 0,
        },
    });
    
    useEffect(() => {
        if (!loading && !hasPermission('hr:read')) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to view this page.',
          });
          router.replace('/dashboard');
        }
    }, [loading, hasPermission, router, toast]);
    
    const filteredLoans = useMemo(() => {
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        return loans.filter(loan =>
            userMap.get(loan.userId)?.toLowerCase().includes(lowercasedTerm) ||
            loan.reason.toLowerCase().includes(lowercasedTerm)
        );
    }, [loans, debouncedSearchTerm, userMap]);

    const totalPages = Math.ceil(filteredLoans.length / ROWS_PER_PAGE);

    const paginatedLoans = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        return filteredLoans.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredLoans, currentPage]);
    
    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm]);

    const handleOpenModal = (loan: Loan | null = null) => {
        setEditingLoan(loan);
        if (loan) {
            form.reset({
                ...loan,
                issueDate: format(new Date(loan.issueDate), 'yyyy-MM-dd'),
            });
        } else {
            form.reset({
                userId: "",
                amount: 0,
                reason: "",
                issueDate: format(new Date(), 'yyyy-MM-dd'),
                monthlyInstallment: 0,
            });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingLoan(null);
        form.reset();
    };

    const onSubmit = (data: LoanFormValues) => {
        if (!hasPermission('hr:write')) {
            toast({ variant: 'destructive', title: 'Permission Denied'});
            return;
        }

        if (editingLoan) {
            setLoans(loans.map(l => l.id === editingLoan.id ? { ...editingLoan, ...data } : l));
            toast({ title: "Loan Updated" });
        } else {
            const newLoan: Loan = {
                id: `loan_${Date.now()}`,
                status: 'Active',
                repayments: [],
                ...data,
            };
            setLoans([newLoan, ...loans]);
            toast({ title: "Loan Created" });
        }
        handleCloseModal();
    };

    const handleDeleteLoan = (loanId: string) => {
        if (!hasPermission('hr:write')) {
            toast({ variant: 'destructive', title: 'Permission Denied'});
            return;
        }
        setLoans(loans.filter(l => l.id !== loanId));
        toast({ title: "Loan Deleted" });
    };

    const canWrite = hasPermission('hr:write');
    if (loading || !hasPermission('hr:read')) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-6xl mx-auto backdrop-blur-lg">
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><HandCoins /> Loans & Advances</CardTitle>
                            <CardDescription>Manage employee loans and salary advances.</CardDescription>
                        </div>
                        <div className="flex-1 max-w-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by employee or reason..." 
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={() => handleOpenModal()} disabled={!canWrite}>
                            <PlusCircle className="mr-2 h-4 w-4" /> New Loan
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Amount Paid</TableHead>
                                <TableHead>Remaining</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedLoans.map(loan => {
                                const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
                                const remaining = loan.amount - totalPaid;
                                return (
                                <TableRow key={loan.id}>
                                    <TableCell className="font-medium">{userMap.get(loan.userId) || 'Unknown User'}</TableCell>
                                    <TableCell>{loan.reason}</TableCell>
                                    <TableCell>${loan.amount.toFixed(2)}</TableCell>
                                    <TableCell>${totalPaid.toFixed(2)}</TableCell>
                                    <TableCell className="font-semibold">${remaining.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusMap[loan.status].color} className="capitalize">{statusMap[loan.status].icon}{loan.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenModal(loan)} disabled={!canWrite}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteLoan(loan.id)} className="text-destructive" disabled={!canWrite}><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLoan ? "Edit Loan" : "Create New Loan/Advance"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="userId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger></FormControl>
                                        <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loan Amount</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="monthlyInstallment" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monthly Installment</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="issueDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Issue</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="reason" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl><Textarea placeholder="Reason for the loan or advance..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button type="submit" disabled={!canWrite}>Save Loan</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
