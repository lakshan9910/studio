
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Payroll, PayrollItem, Attendance, EmployeeSalary } from "@/types";
import { initialAttendance, initialSalaries } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Briefcase, PlusCircle, Printer, ChevronsRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format, differenceInDays, isWithinInterval } from "date-fns";
import Link from "next/link";

const initialDateRange: DateRange = {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: addDays(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 0),
}

export default function PayrollPage() {
    const { user: currentUser, users, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [payrollRuns, setPayrollRuns] = useState<Payroll[]>([]);
    const [attendanceRecords] = useState<Attendance[]>(initialAttendance);
    const [salaries] = useState<EmployeeSalary[]>(initialSalaries);
    
    const [date, setDate] = useState<DateRange | undefined>(initialDateRange);

    useEffect(() => {
        if (!loading && currentUser?.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
            router.replace('/dashboard');
        }
    }, [currentUser, loading, router, toast]);
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const salaryMap = useMemo(() => new Map(salaries.map(s => [s.userId, s.baseSalary])), [salaries]);

    const handleGeneratePayroll = () => {
        if (!date?.from || !date?.to) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid date range.' });
            return;
        }

        const period = `${format(date.from, 'MMM yyyy')}`;
        const totalDaysInPeriod = differenceInDays(date.to, date.from) + 1;

        const newPayrollItems: PayrollItem[] = users.map(user => {
            const baseSalary = salaryMap.get(user.id) || 0;
            const userAttendance = attendanceRecords.filter(
                rec => rec.userId === user.id && isWithinInterval(new Date(rec.date), { start: date.from!, end: date.to! })
            );
            
            const daysPresent = userAttendance.filter(r => r.status === 'Present').length;
            const daysLeave = userAttendance.filter(r => r.status === 'Leave').length;
            const daysWorked = daysPresent + daysLeave;
            const daysAbsent = totalDaysInPeriod - daysWorked;
            
            const dailySalary = baseSalary / totalDaysInPeriod;
            const salaryPayable = dailySalary * daysWorked;

            return {
                userId: user.id,
                userName: user.name || user.email,
                baseSalary,
                daysWorked,
                daysAbsent,
                salaryPayable,
                bonus: 0,
                deductions: 0,
                netPay: salaryPayable,
            };
        });
        
        const newPayroll: Payroll = {
            id: `payroll_${Date.now()}`,
            period,
            dateFrom: date.from.toISOString(),
            dateTo: date.to.toISOString(),
            status: 'Pending',
            items: newPayrollItems
        };

        setPayrollRuns(prev => [newPayroll, ...prev]);
        toast({ title: "Payroll Generated", description: `Payroll for ${period} has been created.` });
    };

    const handleUpdatePayrollItem = (payrollId: string, userId: string, field: 'bonus' | 'deductions', value: number) => {
        setPayrollRuns(prev => prev.map(pr => {
            if (pr.id === payrollId) {
                const newItems = pr.items.map(item => {
                    if (item.userId === userId) {
                        const newItem = { ...item, [field]: value };
                        newItem.netPay = newItem.salaryPayable + newItem.bonus - newItem.deductions;
                        return newItem;
                    }
                    return item;
                });
                return { ...pr, items: newItems };
            }
            return pr;
        }));
    };

    if (!currentUser || currentUser.role !== 'Admin') return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generate New Payroll</CardTitle>
                    <CardDescription>Select a date range to generate a payroll run for your employees.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="date"
                            variant={"outline"}
                            className="w-[300px] justify-start text-left font-normal"
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                                ) : (
                                format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleGeneratePayroll}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Generate Payroll
                    </Button>
                </CardContent>
            </Card>

            {payrollRuns.map(pr => (
                 <Card key={pr.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5"/> Payroll for {pr.period}
                                </CardTitle>
                                <CardDescription>
                                    From {format(new Date(pr.dateFrom), 'PPP')} to {format(new Date(pr.dateTo), 'PPP')}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={pr.status === 'Paid' ? 'default' : 'secondary'}>{pr.status}</Badge>
                                <Link href={{ pathname: '/dashboard/hr/payslip', query: { payrollId: pr.id } }} target="_blank">
                                    <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Slips</Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Base Salary</TableHead>
                                    <TableHead>Worked</TableHead>
                                    <TableHead>Absent</TableHead>
                                    <TableHead>Salary Payable</TableHead>
                                    <TableHead>Bonus</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pr.items.map(item => (
                                    <TableRow key={item.userId}>
                                        <TableCell>{item.userName}</TableCell>
                                        <TableCell>${item.baseSalary.toFixed(2)}</TableCell>
                                        <TableCell>{item.daysWorked}</TableCell>
                                        <TableCell>{item.daysAbsent}</TableCell>
                                        <TableCell>${item.salaryPayable.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                value={item.bonus} 
                                                onChange={e => handleUpdatePayrollItem(pr.id, item.userId, 'bonus', parseFloat(e.target.value) || 0)}
                                                className="w-24 h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                value={item.deductions} 
                                                onChange={e => handleUpdatePayrollItem(pr.id, item.userId, 'deductions', parseFloat(e.target.value) || 0)}
                                                className="w-24 h-8"
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold">${item.netPay.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            ))}
        </div>
    );
}
