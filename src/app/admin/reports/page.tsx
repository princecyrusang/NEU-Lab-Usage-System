
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip,
  CartesianGrid 
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { Loader2, ShieldAlert, TrendingUp, Landmark, Monitor } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  subDays, 
  subMonths, 
  format, 
  eachDayOfInterval, 
  eachMonthOfInterval, 
  isSameDay, 
  isSameMonth,
  startOfDay
} from "date-fns";

type FilterType = "weekly" | "monthly" | "yearly";

export default function LaboratoryReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [timeFilter, setTimeFilter] = useState<FilterType>("weekly");

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isAdmin = profile?.role === "Admin";

  const { filterStartDate, filterEndDate } = useMemo(() => {
    const now = new Date();
    let start;
    if (timeFilter === "weekly") start = subDays(now, 6);
    else if (timeFilter === "monthly") start = subDays(now, 29);
    else start = subMonths(now, 11);
    
    return { 
      filterStartDate: startOfDay(start), 
      filterEndDate: now 
    };
  }, [timeFilter]);

  const usageQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return query(
      collection(firestore, "lab_usage"),
      where("timestamp", ">=", filterStartDate.toISOString()),
      orderBy("timestamp", "asc")
    );
  }, [firestore, isAdmin, filterStartDate]);
  
  const { data: logs, isLoading: usageLoading } = useCollection(usageQuery);

  const stats = useMemo(() => {
    if (!logs) return { roomData: [], collegeData: [], usageTrend: [] };

    const getLogDate = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate();
      return new Date(ts);
    };

    // Group by Room
    const rooms = logs.reduce((acc: any[], log) => {
      const room = log.roomNumber || "Unknown Room";
      const existing = acc.find(a => a.name === room);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: room, value: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value).slice(0, 10);

    // Group by College/Department
    const colleges = logs.reduce((acc: any[], log) => {
      const office = log.collegeOffice || "Unknown Office";
      const existing = acc.find(a => a.name === office);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: office, value: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value);

    // Usage Trend Logic with zero-filling
    let trend: { date: string, count: number, fullDate: string }[] = [];

    if (timeFilter === "weekly") {
      const days = eachDayOfInterval({ start: filterStartDate, end: filterEndDate });
      trend = days.map(day => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameDay(d, day);
        }).length;
        return { 
          date: format(day, 'MMM dd'), 
          count,
          fullDate: format(day, 'PPPP')
        };
      });
    } else if (timeFilter === "monthly") {
      const days = eachDayOfInterval({ start: filterStartDate, end: filterEndDate });
      trend = days.map(day => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameDay(d, day);
        }).length;
        return { 
          date: format(day, 'MMM dd'), 
          count,
          fullDate: format(day, 'PPPP')
        };
      });
    } else if (timeFilter === "yearly") {
      const months = eachMonthOfInterval({ start: filterStartDate, end: filterEndDate });
      trend = months.map(month => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameMonth(d, month);
        }).length;
        return { 
          date: format(month, 'MMM'), 
          count,
          fullDate: format(month, 'MMMM yyyy')
        };
      });
    }

    return { roomData: rooms, collegeData: colleges, usageTrend: trend };
  }, [logs, timeFilter, filterStartDate, filterEndDate]);

  if (authLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-destructive/10 flex items-center justify-center rounded-full">
              <ShieldAlert className="w-12 h-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-destructive">Restricted Access</h3>
              <p className="text-muted-foreground">Institutional reports are only accessible to system administrators.</p>
            </div>
            <Link href="/dashboard/" className="block">
              <Button className="w-full py-6">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const FilterButton = ({ type, label }: { type: FilterType, label: string }) => (
    <Button
      variant={timeFilter === type ? "default" : "ghost"}
      size="sm"
      onClick={() => setTimeFilter(type)}
      className={`text-xs font-bold uppercase tracking-wider h-8 ${
        timeFilter === type ? "bg-primary text-white" : "text-muted-foreground hover:bg-primary/10"
      }`}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-8 pb-10">
      <AdminPageHeader 
        title="Institutional Reports" 
        description="Data analysis of NEU LAB ROOM utilization and faculty engagement trends." 
      />

      <div className="grid gap-6">
        {/* Main Trend Chart */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 font-black text-slate-900">
                <TrendingUp className="w-6 h-6 text-primary" />
                Usage Frequency Trends
              </CardTitle>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                Data from {format(filterStartDate, 'MMM dd')} to {format(filterEndDate, 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex bg-muted/50 p-1 rounded-lg gap-1 self-end sm:self-auto border">
              <FilterButton type="weekly" label="Weekly" />
              <FilterButton type="monthly" label="Monthly" />
              <FilterButton type="yearly" label="Yearly" />
            </div>
          </CardHeader>
          <CardContent className="h-[450px] pt-6">
            {usageLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.usageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0C46A3" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0C46A3" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700 }}
                    interval={timeFilter === 'monthly' ? 4 : 0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 shadow-2xl rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                              {payload[0].payload.fullDate}
                            </p>
                            <p className="text-lg font-black text-primary">
                              {payload[0].value} Sessions
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0C46A3" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorUsage)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Room Distribution */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-cyan-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-black">
                <Monitor className="w-5 h-5 text-cyan-600" />
                Top Room Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.roomData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 600 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="#0C46A3" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement by Office */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-indigo-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-black">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Engagement by Office
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.collegeData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 9, fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="#47C1EB" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
