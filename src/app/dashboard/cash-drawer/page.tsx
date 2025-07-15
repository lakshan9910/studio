
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import type { CashDrawerSession, Sale, CashDrawerEntry, CashDrawerEntryType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { CaseSensitive, PlusCircle, ArrowUp, ArrowDown } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const openSessionSchema = z.object({
  openingFloat: z.coerce.number().min(0, "Opening float must be a positive number."),
});
type OpenSessionForm = z.infer<typeof openSessionSchema>;

const closeSessionSchema = z.object({
  closingFloat: z.coerce.number().min(0, "Closing float must be a positive number."),
});
type CloseSessionForm = z.infer<typeof closeSessionSchema>;

export default function CashDrawerPage() {
    const { user, hasPermission, loading } = useAuth();
    const { settings } = useSettings();
    const router = useRouter();
    const { toast } = useToast();

    // In a real app, this would be fetched and persisted.
    const [sessions, setSessions] = useState<CashDrawerSession[]>([]);
    const [sales, setSales] = useState<Sale[]>([]); 

    useEffect(() => {
        if (!loading && (!hasPermission('cashdrawer:read') || !settings.enableCashDrawer)) {
            toast({ variant: 'destructive', title: 'Access Denied' });
            router.replace('/dashboard');
        }
    }, [user, loading, hasPermission, settings.enableCashDrawer, router, toast]);

    const activeSession = useMemo(() => sessions.find(s => s.status === 'Active'), [sessions]);

    const openSessionForm = useForm<OpenSessionForm>({
        resolver: zodResolver(openSessionSchema),
        defaultValues: { openingFloat: 0 },
    });
    const closeSessionForm = useForm<CloseSessionForm>({
        resolver: zodResolver(closeSessionSchema),
        defaultValues: { closingFloat: 0 },
    });

    const handleStartSession = (data: OpenSessionForm) => {
        if (activeSession) {
            toast({ variant: 'destructive', title: 'Error', description: 'An active session already exists.' });
            return;
        }
        const newSession: CashDrawerSession = {
            id: `session_${Date.now()}`,
            startTime: new Date().toISOString(),
            openingFloat: data.openingFloat,
            cashSales: 0,
            entries: [],
            status: 'Active',
        };
        setSessions(prev => [newSession, ...prev]);
        toast({ title: 'Session Started', description: `Cash drawer session started with an opening float of $${data.openingFloat.toFixed(2)}`});
        openSessionForm.reset();
        document.getElementById('start-session-close')?.click();
    };

    const handleEndSession = (data: CloseSessionForm) => {
        if (!activeSession) return;
        const totalCashIn = activeSession.entries.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.amount, 0);
        const totalCashOut = activeSession.entries.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.amount, 0);
        const totalCashInDrawer = activeSession.openingFloat + activeSession.cashSales + totalCashIn - totalCashOut;
        const variance = data.closingFloat - totalCashInDrawer;

        setSessions(prev => prev.map(s => s.id === activeSession.id ? {
            ...s,
            status: 'Closed',
            endTime: new Date().toISOString(),
            closingFloat: data.closingFloat,
            variance,
        } : s));
        toast({ title: 'Session Ended', description: `Variance of $${variance.toFixed(2)} recorded.` });
        closeSessionForm.reset();
        document.getElementById('end-session-close')?.click();
    };
    
    const handleAddEntry = (sessionId: string, type: CashDrawerEntryType, amount: number, reason: string) => {
        const newEntry: CashDrawerEntry = {
            id: `entry_${Date.now()}`,
            type,
            amount,
            reason,
            timestamp: new Date().toISOString(),
        };
        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            entries: [...s.entries, newEntry]
        } : s));
    };

    if (!settings.enableCashDrawer || !hasPermission('cashdrawer:read')) {
        return null;
    }

    const canWrite = hasPermission('cashdrawer:write');
    const totalCashIn = activeSession ? activeSession.entries.filter(e => e.type === 'IN').reduce((s, e) => s + e.amount, 0) : 0;
    const totalCashOut = activeSession ? activeSession.entries.filter(e => e.type === 'OUT').reduce((s, e) => s + e.amount, 0) : 0;
    const expectedCash = activeSession ? activeSession.openingFloat + activeSession.cashSales + totalCashIn - totalCashOut : 0;


    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><CaseSensitive /> Cash Register</h1>
                {!activeSession && canWrite && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Start New Session</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Start New Session</DialogTitle></DialogHeader>
                            <Form {...openSessionForm}>
                                <form onSubmit={openSessionForm.handleSubmit(handleStartSession)} className="space-y-4 py-4">
                                     <FormField
                                        control={openSessionForm.control}
                                        name="openingFloat"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Opening Cash Amount</FormLabel>
                                            <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild><Button id="start-session-close" type="button" variant="ghost">Cancel</Button></DialogClose>
                                        <Button type="submit">Start Session</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
                 {activeSession && canWrite && (
                      <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive">End Session</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>End Current Session</DialogTitle></DialogHeader>
                             <Form {...closeSessionForm}>
                                <form onSubmit={closeSessionForm.handleSubmit(handleEndSession)} className="space-y-4 py-4">
                                     <FormField
                                        control={closeSessionForm.control}
                                        name="closingFloat"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Counted Cash Amount</FormLabel>
                                            <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild><Button id="end-session-close" type="button" variant="ghost">Cancel</Button></DialogClose>
                                        <Button type="submit" variant="destructive">End Session</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {activeSession ? (
                <Card className="backdrop-blur-lg bg-white/50 dark:bg-black/50">
                    <CardHeader>
                        <CardTitle>Active Session</CardTitle>
                        <CardDescription>Started at {format(parseISO(activeSession.startTime), "PPP p")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Summary</h3>
                             <div className="space-y-2 text-sm p-4 bg-muted rounded-lg">
                                <div className="flex justify-between"><span>Opening Float:</span> <span className="font-medium">${activeSession.openingFloat.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Cash Sales:</span> <span className="font-medium">${activeSession.cashSales.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Cash In (Manual):</span> <span className="font-medium text-green-600">${totalCashIn.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Cash Out (Manual):</span> <span className="font-medium text-red-600">-${totalCashOut.toFixed(2)}</span></div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base"><span>Expected in Drawer:</span> <span>${expectedCash.toFixed(2)}</span></div>
                             </div>
                        </div>
                         <div className="space-y-4">
                             <h3 className="font-semibold">Manual Entries</h3>
                             <ScrollArea className="h-48">
                                <Table>
                                    <TableBody>
                                        {activeSession.entries.map(e => (
                                            <TableRow key={e.id}>
                                                <TableCell>
                                                    {e.type === 'IN' ? <ArrowUp className="h-4 w-4 text-green-500"/> : <ArrowDown className="h-4 w-4 text-red-500"/>}
                                                </TableCell>
                                                <TableCell>{e.reason}</TableCell>
                                                <TableCell className="text-right font-medium">${e.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                 <Card className="text-center p-12 backdrop-blur-lg bg-white/50 dark:bg-black/50">
                    <CardTitle>No Active Session</CardTitle>
                    <CardDescription>Start a new session to begin tracking cash transactions.</CardDescription>
                </Card>
            )}

             <Card className="backdrop-blur-lg bg-white/50 dark:bg-black/50">
                <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Start Time</TableHead>
                                <TableHead>End Time</TableHead>
                                <TableHead>Opening</TableHead>
                                <TableHead>Closing</TableHead>
                                <TableHead>Variance</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length > 0 ? sessions.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{format(parseISO(s.startTime), "PPp")}</TableCell>
                                    <TableCell>{s.endTime ? format(parseISO(s.endTime), "PPp") : 'N/A'}</TableCell>
                                    <TableCell>${s.openingFloat.toFixed(2)}</TableCell>
                                    <TableCell>{s.closingFloat ? `$${s.closingFloat.toFixed(2)}` : 'N/A'}</TableCell>
                                    <TableCell className={s.variance && s.variance !== 0 ? 'text-destructive font-bold' : ''}>
                                        {s.variance ? `$${s.variance.toFixed(2)}` : 'N/A'}
                                    </TableCell>
                                    <TableCell><Badge variant={s.status === 'Active' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No session history found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

    