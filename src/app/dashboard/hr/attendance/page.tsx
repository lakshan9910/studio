
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { initialAttendance } from "@/lib/data";
import type { Attendance, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { CalendarCheck, UserCheck, UserX, Coffee } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AttendancePage() {
    const { user: currentUser, users, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>(initialAttendance);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

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

    const handleAttendanceChange = (userId: string, status: 'Present' | 'Absent' | 'Leave') => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const existingRecordIndex = attendanceRecords.findIndex(
            rec => rec.userId === userId && rec.date === dateString
        );

        if (existingRecordIndex > -1) {
            const updatedRecords = [...attendanceRecords];
            updatedRecords[existingRecordIndex].status = status;
            setAttendanceRecords(updatedRecords);
        } else {
            const newRecord: Attendance = {
                id: `att_${Date.now()}`,
                userId,
                date: dateString,
                status,
            };
            setAttendanceRecords([...attendanceRecords, newRecord]);
        }
        toast({ title: "Attendance updated!"});
    };
    
    const getAttendanceStatusForUser = (userId: string) => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return attendanceRecords.find(rec => rec.userId === userId && rec.date === dateString)?.status;
    };
    
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const monthAttendance = useMemo(() => {
        const monthData = new Map<string, { present: number, absent: number, leave: number }>();
        users.forEach(user => {
            monthData.set(user.id, { present: 0, absent: 0, leave: 0 });
        });
        
        const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        attendanceRecords.forEach(rec => {
            if (rec.date >= monthStart && rec.date <= monthEnd) {
                const userData = monthData.get(rec.userId);
                if (userData) {
                    if (rec.status === 'Present') userData.present++;
                    if (rec.status === 'Absent') userData.absent++;
                    if (rec.status === 'Leave') userData.leave++;
                }
            }
        });
        return monthData;
    }, [attendanceRecords, users, currentMonth]);

    if (!currentUser || currentUser.role !== 'Admin') {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Attendance</CardTitle>
                        <CardDescription>
                            Mark attendance for {format(selectedDate, "PPP")}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.imageUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                                                    <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                value={getAttendanceStatusForUser(user.id) || ''}
                                                onValueChange={(value: 'Present' | 'Absent' | 'Leave') => handleAttendanceChange(user.id, value)}
                                            >
                                                <SelectTrigger className="w-[150px] ml-auto">
                                                    <SelectValue placeholder="Mark Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Present">Present</SelectItem>
                                                    <SelectItem value="Absent">Absent</SelectItem>
                                                    <SelectItem value="Leave">Leave</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card>
                    <CardContent className="p-0">
                         <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            onMonthChange={setCurrentMonth}
                            className="p-0"
                            classNames={{
                                month: "space-y-4 p-3",
                                day: "h-9 w-9",
                                head_cell: "w-9",
                            }}
                             modifiers={{
                                present: (date) => attendanceRecords.some(r => isSameDay(date, new Date(r.date)) && r.status === 'Present'),
                                absent: (date) => attendanceRecords.some(r => isSameDay(date, new Date(r.date)) && r.status === 'Absent'),
                                leave: (date) => attendanceRecords.some(r => isSameDay(date, new Date(r.date)) && r.status === 'Leave'),
                            }}
                             modifiersStyles={{
                                present: {
                                    color: 'hsl(var(--primary-foreground))',
                                    backgroundColor: 'hsl(var(--primary))'
                                },
                                absent: {
                                    color: 'hsl(var(--destructive-foreground))',
                                    backgroundColor: 'hsl(var(--destructive))'
                                },
                                leave: {
                                    color: 'hsl(var(--secondary-foreground))',
                                    backgroundColor: 'hsl(var(--secondary))'
                                }
                            }}
                        />
                    </CardContent>
                </Card>
                 <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Monthly Summary</CardTitle>
                        <CardDescription>For {format(currentMonth, 'MMMM yyyy')}</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="space-y-4">
                            {users.map(user => {
                                const data = monthAttendance.get(user.id);
                                return (
                                    <div key={user.id}>
                                        <p className="font-semibold text-sm">{user.name}</p>
                                        <div className="flex justify-around items-center text-xs mt-1">
                                            <Badge variant="default" className="gap-1">
                                                <UserCheck className="h-3 w-3"/> P: {data?.present || 0}
                                            </Badge>
                                             <Badge variant="destructive" className="gap-1">
                                                <UserX className="h-3 w-3"/> A: {data?.absent || 0}
                                            </Badge>
                                             <Badge variant="secondary" className="gap-1">
                                                <Coffee className="h-3 w-3"/> L: {data?.leave || 0}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
