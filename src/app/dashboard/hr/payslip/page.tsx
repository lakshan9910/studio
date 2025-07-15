
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { Payroll } from '@/types';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

// This is a placeholder. In a real app, you'd fetch this from your state/DB.
const PAYROLL_RUNS: Payroll[] = []; 

function PaySlipContent() {
    const searchParams = useSearchParams();
    const payrollId = searchParams.get('payrollId');
    const { settings } = useSettings();
    
    // In a real app, you would fetch the payroll data based on payrollId
    // For this example, we'll just find it in the (currently empty) placeholder.
    // A more robust solution would be needed to get the generated payroll runs here.
    const payrollRun: Payroll | undefined = PAYROLL_RUNS.find(p => p.id === payrollId);

    const handlePrint = () => {
        window.print();
    };

    if (!payrollRun) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-destructive mb-2">Payroll Not Found</h1>
                    <p className="text-muted-foreground">Could not find the specified payroll run. Please generate it first.</p>
                     <Button onClick={() => window.close()} className="mt-4">Close Tab</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white p-4 flex justify-between items-center print:hidden">
                <h1 className="text-lg font-bold">Print Pay Slips</h1>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print All</Button>
            </header>
            <main className="p-4 md:p-8" id="printable-area">
                <div className="space-y-8">
                    {payrollRun.items.map(item => (
                        <div key={item.userId} className="p-6 bg-white rounded-lg shadow-md page-break-after">
                            <header className="flex justify-between items-center border-b pb-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{settings.storeName}</h2>
                                    <p className="text-muted-foreground">Pay Slip</p>
                                </div>
                                <div className="text-right">
                                    <p><strong>Period:</strong> {payrollRun.period}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(payrollRun.dateFrom), 'PPP')} to {format(new Date(payrollRun.dateTo), 'PPP')}
                                    </p>
                                </div>
                            </header>

                            <section className="mb-6">
                                <h3 className="font-semibold text-lg mb-2">Employee Details</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <p><strong>Employee Name:</strong></p><p>{item.userName}</p>
                                    <p><strong>User ID:</strong></p><p>{item.userId}</p>
                                </div>
                            </section>

                            <section>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 border-b pb-1">Earnings</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between"><p>Base Salary:</p> <p>${item.baseSalary.toFixed(2)}</p></div>
                                            <div className="flex justify-between"><p>Salary Payable ({item.daysWorked} days):</p> <p>${item.salaryPayable.toFixed(2)}</p></div>
                                            <div className="flex justify-between"><p>Bonus:</p> <p>${item.bonus.toFixed(2)}</p></div>
                                            <div className="flex justify-between font-bold border-t pt-1 mt-1"><p>Total Earnings:</p> <p>${(item.salaryPayable + item.bonus).toFixed(2)}</p></div>
                                        </div>
                                    </div>
                                    <div>
                                         <h3 className="font-semibold text-lg mb-2 border-b pb-1">Deductions</h3>
                                         <div className="space-y-1 text-sm">
                                            <div className="flex justify-between"><p>Absence ({item.daysAbsent} days):</p> <p>${(item.baseSalary - item.salaryPayable).toFixed(2)}</p></div>
                                            <div className="flex justify-between"><p>Other Deductions:</p> <p>${item.deductions.toFixed(2)}</p></div>
                                            <div className="flex justify-between font-bold border-t pt-1 mt-1"><p>Total Deductions:</p> <p>${(item.baseSalary - item.salaryPayable + item.deductions).toFixed(2)}</p></div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <footer className="mt-6 border-t-2 border-dashed pt-4 text-center">
                                <p className="text-xl font-bold">Net Pay: ${(item.netPay).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-4">{settings.receiptFooterText}</p>
                            </footer>
                        </div>
                    ))}
                </div>
            </main>
             <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .page-break-after {
                        page-break-after: always;
                    }
                }
            `}</style>
        </div>
    );
}


export default function PaySlipPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaySlipContent />
        </Suspense>
    )
}
