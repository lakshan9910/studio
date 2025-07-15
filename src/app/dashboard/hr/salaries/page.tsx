
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { EmployeeSalary, SalaryComponent } from "@/types";
import { initialSalaries } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash, Edit, Search, HandCoins, CheckCircle, Clock, DollarSign, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const salaryComponentSchema = z.object({
  name: z.string().min(1, "Name is required."),
  amount: z.coerce.number().min(0, "Amount must be non-negative."),
});

const salarySchema = z.object({
    userId: z.string().min(1, "Employee is required."),
    baseSalary: z.coerce.number().min(0, "Base salary must be non-negative."),
    allowances: z.array(salaryComponentSchema).optional(),
    deductions: z.array(salaryComponentSchema).optional(),
});

type SalaryFormValues = z.infer<typeof salarySchema>;

export default function SalariesPage() {
    const { users, loading, hasPermission } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [salaries, setSalaries] = useState<EmployeeSalary[]>(initialSalaries);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSalary, setEditingSalary] = useState<EmployeeSalary | null>(null);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const form = useForm<SalaryFormValues>({
        resolver: zodResolver(salarySchema),
        defaultValues: {
            userId: "",
            baseSalary: 0,
            allowances: [],
            deductions: [],
        },
    });

    const { fields: allowanceFields, append: appendAllowance, remove: removeAllowance } = useFieldArray({ control: form.control, name: "allowances" });
    const { fields: deductionFields, append: appendDeduction, remove: removeDeduction } = useFieldArray({ control: form.control, name: "deductions" });
    
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

    const handleOpenModal = (salary: EmployeeSalary | null = null) => {
        setEditingSalary(salary);
        if (salary) {
            form.reset(salary);
        } else {
            form.reset({ userId: "", baseSalary: 0, allowances: [], deductions: [] });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingSalary(null);
        form.reset();
    };

    const onSubmit = (data: SalaryFormValues) => {
        if (!hasPermission('hr:write')) {
            toast({ variant: 'destructive', title: 'Permission Denied'});
            return;
        }

        const existingSalaryIndex = salaries.findIndex(s => s.userId === data.userId);

        if (existingSalaryIndex > -1) {
            setSalaries(salaries.map((s, index) => index === existingSalaryIndex ? data : s));
            toast({ title: "Salary Updated" });
        } else {
            setSalaries([...salaries, data]);
            toast({ title: "Salary Created" });
        }
        handleCloseModal();
    };

    const canWrite = hasPermission('hr:write');
    if (loading || !hasPermission('hr:read')) return null;
    
    const usersWithoutSalary = users.filter(u => !salaries.some(s => s.userId === u.id));

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-6xl mx-auto backdrop-blur-lg">
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><DollarSign /> Employee Salaries</CardTitle>
                            <CardDescription>Manage salary structures for all employees.</CardDescription>
                        </div>
                         <Button onClick={() => handleOpenModal()} disabled={!canWrite || usersWithoutSalary.length === 0}>
                            <PlusCircle className="mr-2 h-4 w-4" /> New Salary
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>Total Allowances</TableHead>
                                <TableHead>Total Deductions</TableHead>
                                <TableHead>Net Salary</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salaries.map(salary => {
                                const user = userMap.get(salary.userId);
                                if (!user) return null;

                                const totalAllowances = salary.allowances.reduce((sum, a) => sum + a.amount, 0);
                                const totalDeductions = salary.deductions.reduce((sum, d) => sum + d.amount, 0);
                                const netSalary = salary.baseSalary + totalAllowances - totalDeductions;

                                return (
                                <TableRow key={salary.userId}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.imageUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                                                <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>${salary.baseSalary.toFixed(2)}</TableCell>
                                    <TableCell>${totalAllowances.toFixed(2)}</TableCell>
                                    <TableCell>${totalDeductions.toFixed(2)}</TableCell>
                                    <TableCell className="font-semibold">${netSalary.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(salary)} disabled={!canWrite}>
                                            <Edit className="mr-2 h-4 w-4" /> Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSalary ? "Edit Salary Structure" : "Create New Salary Structure"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <FormField control={form.control} name="userId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingSalary}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {editingSalary && userMap.has(editingSalary.userId) && <SelectItem value={editingSalary.userId}>{userMap.get(editingSalary.userId)?.name}</SelectItem>}
                                            {usersWithoutSalary.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="baseSalary" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Base Salary (Monthly)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            <Separator />
                            
                            <div>
                                <FormLabel>Allowances</FormLabel>
                                <div className="space-y-2 mt-2">
                                    {allowanceFields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                                            <FormField control={form.control} name={`allowances.${index}.name`} render={({field}) => <Input placeholder="Allowance Name" {...field} />} />
                                            <FormField control={form.control} name={`allowances.${index}.amount`} render={({field}) => <Input type="number" placeholder="Amount" {...field} />} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendAllowance({name: '', amount: 0})}>
                                        <PlusCircle className="mr-2 h-4 w-4"/> Add Allowance
                                    </Button>
                                </div>
                            </div>
                            
                            <Separator />

                            <div>
                                <FormLabel>Recurring Deductions</FormLabel>
                                <div className="space-y-2 mt-2">
                                    {deductionFields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                                            <FormField control={form.control} name={`deductions.${index}.name`} render={({field}) => <Input placeholder="Deduction Name" {...field} />} />
                                            <FormField control={form.control} name={`deductions.${index}.amount`} render={({field}) => <Input type="number" placeholder="Amount" {...field} />} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendDeduction({name: '', amount: 0})}>
                                        <PlusCircle className="mr-2 h-4 w-4"/> Add Deduction
                                    </Button>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button type="submit" disabled={!canWrite}>Save Salary</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
