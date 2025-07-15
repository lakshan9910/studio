
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { PaymentMethod } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, CreditCard, Landmark, MonitorSmartphone, Wallet } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';


export interface PaymentDetails {
    method: PaymentMethod;
    amountPaid: number;
    change: number;
    dueDate?: string;
}

const paymentSchema = z.object({
  method: z.enum(['Cash', 'Card', 'Online', 'Credit']),
  amountPaid: z.coerce.number().optional(),
  dueDate: z.date().optional(),
}).refine(data => {
    if (data.method === 'Credit') {
        return !!data.dueDate;
    }
    return true;
}, {
    message: 'Due date is required for credit payments.',
    path: ['dueDate'],
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: PaymentDetails) => void;
  totalAmount: number;
}

const paymentMethods: { value: PaymentMethod, label: string, icon: React.ReactNode}[] = [
    { value: 'Cash', label: 'Cash', icon: <Wallet className="h-5 w-5" /> },
    { value: 'Card', label: 'Card', icon: <CreditCard className="h-5 w-5" /> },
    { value: 'Online', label: 'Online', icon: <MonitorSmartphone className="h-5 w-5" /> },
    { value: 'Credit', label: 'Credit', icon: <Landmark className="h-5 w-5" /> },
]

export function PaymentModal({ isOpen, onClose, onConfirm, totalAmount }: PaymentModalProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: 'Cash',
      amountPaid: totalAmount,
      dueDate: addDays(new Date(), 30),
    },
  });

  const selectedMethod = form.watch('method');
  const amountPaid = form.watch('amountPaid') || 0;

  const change = selectedMethod === 'Cash' ? amountPaid - totalAmount : 0;
  
  const quickCashValues = [totalAmount, Math.ceil(totalAmount/5)*5, Math.ceil(totalAmount/10)*10, Math.ceil(totalAmount/50)*50 + 50];

  const handleSubmit = (data: PaymentFormValues) => {
    if (data.method === 'Cash' && (!data.amountPaid || data.amountPaid < totalAmount)) {
        form.setError('amountPaid', { message: 'Amount must be at least the total.' });
        return;
    }

    onConfirm({
        method: data.method,
        amountPaid: data.amountPaid || totalAmount,
        change: change > 0 ? change : 0,
        dueDate: data.dueDate?.toISOString(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Total Amount: <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
             <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       {paymentMethods.map(method => (
                           <Button
                                key={method.value}
                                type="button"
                                variant={field.value === method.value ? "default" : "outline"}
                                onClick={() => field.onChange(method.value)}
                                className="h-20 flex-col gap-2"
                           >
                               {method.icon}
                               {method.label}
                           </Button>
                       ))}
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedMethod === 'Cash' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Tendered</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2">
                    {quickCashValues.filter((v, i, a) => a.indexOf(v) === i).map(value => (
                         <Button key={value} type="button" variant="secondary" size="sm" onClick={() => form.setValue('amountPaid', value, { shouldValidate: true })}>
                            ${value.toFixed(2)}
                        </Button>
                    ))}
                </div>
                {change >= 0 && (
                    <div className="text-center font-bold text-xl p-4 bg-muted rounded-lg">
                        Change Due: ${change.toFixed(2)}
                    </div>
                )}
              </div>
            )}
            
             {selectedMethod === 'Credit' && (
                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Payment Due Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             )}


            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Confirm Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
