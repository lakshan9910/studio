
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import type { Payroll, PayrollItem, Attendance, EmployeeSalary, Loan, SalaryComponent } from "@/types";
import { initialAttendance, initialSalaries, initialLoans } from "@/lib/data";
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';

const initialDateRange: DateRange = {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: addDays(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 0),
}

export default function PayrollPage() {
    const { user: currentUser, users, loading, hasPermission } = useAuth();
    const { settings } = useSettings();
    const router = useRouter();
    const { toast } = useToast();

    const [payrollRuns, setPayrollRuns] = useState<Payroll[]>([]);
    const [attendanceRecords] = useState<Attendance[]>(initialAttendance);
    const [salaries] = useState<EmployeeSalary[]>(initialSalaries);
    const [loans, setLoans] = useState<Loan[]>(initialLoans);
    
    const [date, setDate] = useState<DateRange | undefined>(initialDateRange);

    useEffect(() => {
        if (!loading && !hasPermission('hr:read')) {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
            router.replace('/dashboard');
        }
    }, [currentUser, loading, router, toast, hasPermission]);
    
    const salaryMap = useMemo(() => new Map(salaries.map(s => [s.userId, s])), [salaries]);
    const canWrite = hasPermission('hr:write');

    const handleGeneratePayroll = () => {
        if (!canWrite) {
             toast({ variant: 'destructive', title: 'Permission Denied' });
             return;
        }
        if (!date?.from || !date?.to) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid date range.' });
            return;
        }

        const period = `${format(date.from, 'MMM yyyy')}`;
        const totalDaysInPeriod = differenceInDays(date.to, date.from) + 1;
        
        const isWagesBoard = settings.payrollType === 'wagesBoard';
        const noPayDivisor = isWagesBoard ? 26 : 30;
        const otDivisor = isWagesBoard ? 200 : 240;

        const newPayrollItems: PayrollItem[] = users.map(user => {
            const salaryStructure = salaryMap.get(user.id);
            const baseSalary = salaryStructure?.baseSalary || 0;
            const allowances = salaryStructure?.allowances || [];
            const recurringDeductions = salaryStructure?.deductions || [];

            const userAttendance = attendanceRecords.filter(
                rec => rec.userId === user.id && isWithinInterval(new Date(rec.date), { start: date.from!, end: date.to! })
            );
            
            const daysAbsent = userAttendance.filter(r => r.status === 'Absent').length;
            
            const noPayDeduction = (baseSalary / noPayDivisor) * daysAbsent;
            
            const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
            
            const loanDeductions = loans
              .filter(l => l.userId === user.id && l.status === 'Active')
              .map(loan => ({
                id: `deduct_${loan.id}_${Date.now()}`,
                type: 'Loan' as const,
                description: `Installment for loan ${loan.id.slice(-4)}`,
                amount: loan.monthlyInstallment,
                loanId: loan.id
              }));

            const allDeductions = [...recurringDeductions, ...loanDeductions];
            
            const initialItem: Omit<PayrollItem, 'netPay' | 'grossEarnings'> = {
                userId: user.id,
                userName: user.name || user.email,
                baseSalary,
                allowances,
                daysAbsent,
                noPayDeduction,
                overtimeNormalHours: 0,
                overtimeSundayHours: 0,
                overtimeHolidayHours: 0,
                overtimePay: 0,
                bonus: 0,
                deductions: allDeductions,
            };
            
            const grossEarnings = baseSalary + totalAllowances + initialItem.overtimePay + initialItem.bonus - noPayDeduction;
            const totalDeductionsAmount = initialItem.deductions.reduce((sum, d) => sum + d.amount, 0);
            const netPay = grossEarnings - totalDeductionsAmount;

            return {
                ...initialItem,
                grossEarnings,
                netPay
            };
        });
        
        const newPayroll: Payroll = {
            id: `payroll_${Date.now()}`,
            period,
            dateFrom: date.from.toISOString(),
            dateTo: date.to.toISOString(),
            status: 'Pending',
            items: newPayrollItems,
            payrollType: settings.payrollType
        };

        setPayrollRuns(prev => [newPayroll, ...prev]);
        toast({ title: "Payroll Generated", description: `Payroll for ${period} has been created.` });
    };

    const handleUpdatePayrollItem = (payrollId: string, userId: string, field: 'bonus' | 'otherDeductions' | 'overtimeNormal' | 'overtimeSunday' | 'overtimeHoliday', value: number) => {
         if (!canWrite) {
             toast({ variant: 'destructive', title: 'Permission Denied' });
             return;
        }
        setPayrollRuns(prev => prev.map(pr => {
            if (pr.id === payrollId) {
                const isWagesBoard = pr.payrollType === 'wagesBoard';
                const otDivisor = isWagesBoard ? 200 : 240;

                const newItems = pr.items.map(item => {
                    if (item.userId === userId) {
                        const newItem = { ...item };
                        
                        if (field === 'bonus') newItem.bonus = value;
                        if (field === 'overtimeNormal') newItem.overtimeNormalHours = value;
                        if (field === 'overtimeSunday') newItem.overtimeSundayHours = value;
                        if (field === 'overtimeHoliday') newItem.overtimeHolidayHours = value;
                        
                        if (field === 'otherDeductions') {
                             const otherDeductionIndex = newItem.deductions.findIndex(d => 'type' in d && d.type === 'Other');
                            if (otherDeductionIndex > -1) {
                                if (value > 0) {
                                    (newItem.deductions[otherDeductionIndex] as any).amount = value;
                                } else {
                                    newItem.deductions.splice(otherDeductionIndex, 1);
                                }
                            } else if (value > 0) {
                                newItem.deductions.push({
                                    id: `deduct_other_${Date.now()}`,
                                    type: 'Other',
                                    description: 'Manual Deduction',
                                    amount: value
                                });
                            }
                        }
                        
                        const hourlyRate = newItem.baseSalary / otDivisor;
                        const otNormalPay = hourlyRate * 1.5 * newItem.overtimeNormalHours;
                        const otSundayPay = hourlyRate * 2 * newItem.overtimeSundayHours;
                        const otHolidayPay = hourlyRate * 2 * newItem.overtimeHolidayHours;
                        newItem.overtimePay = otNormalPay + otSundayPay + otHolidayPay;

                        const totalAllowances = newItem.allowances.reduce((sum, a) => sum + a.amount, 0);
                        const totalDeductions = newItem.deductions.reduce((sum, d) => sum + d.amount, 0);
                        newItem.grossEarnings = newItem.baseSalary + totalAllowances + newItem.overtimePay + newItem.bonus - newItem.noPayDeduction;
                        newItem.netPay = newItem.grossEarnings - totalDeductions;
                        return newItem;
                    }
                    return item;
                });
                return { ...pr, items: newItems };
            }
            return pr;
        }));
    };

    if (!currentUser || !hasPermission('hr:read')) return null;

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
                    <Button onClick={handleGeneratePayroll} disabled={!canWrite}>
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
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Gross</TableHead>
                                    <TableHead>Bonus</TableHead>
                                    <TableHead>OT Normal (hrs)</TableHead>
                                    <TableHead>OT Sunday (hrs)</TableHead>
                                    <TableHead>OT Holiday (hrs)</TableHead>
                                    <TableHead>OT Pay</TableHead>
                                    <TableHead>Other Deductions</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pr.items.map(item => (
                                    <TableRow key={item.userId}>
                                        <TableCell>{item.userName}</TableCell>
                                        <TableCell>${item.grossEarnings.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                defaultValue={item.bonus} 
                                                onBlur={e => handleUpdatePayrollItem(pr.id, item.userId, 'bonus', parseFloat(e.target.value) || 0)}
                                                className="w-24 h-8"
                                                disabled={!canWrite}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" defaultValue={item.overtimeNormalHours} onBlur={e => handleUpdatePayrollItem(pr.id, item.userId, 'overtimeNormal', parseFloat(e.target.value) || 0)} className="w-24 h-8" disabled={!canWrite} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" defaultValue={item.overtimeSundayHours} onBlur={e => handleUpdatePayrollItem(pr.id, item.userId, 'overtimeSunday', parseFloat(e.target.value) || 0)} className="w-24 h-8" disabled={!canWrite} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" defaultValue={item.overtimeHolidayHours} onBlur={e => handleUpdatePayrollItem(pr.id, item.userId, 'overtimeHoliday', parseFloat(e.target.value) || 0)} className="w-24 h-8" disabled={!canWrite} />
                                        </TableCell>
                                         <TableCell>${item.overtimePay.toFixed(2)}</TableCell>
                                        <TableCell>
                                             <Input 
                                                type="number" 
                                                defaultValue={(item.deductions.find(d => 'type' in d && d.type === 'Other') as any)?.amount || 0}
                                                onBlur={e => handleUpdatePayrollItem(pr.id, item.userId, 'otherDeductions', parseFloat(e.target.value) || 0)}
                                                className="w-24 h-8"
                                                disabled={!canWrite}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Auto: ${item.deductions.filter(d => 'type' in d ? d.type !== 'Other' : true).reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                                            </p>
                                        </TableCell>
                                        <TableCell className="font-bold">${item.netPay.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                 </Card>
            ))}
        </div>
    );
}
