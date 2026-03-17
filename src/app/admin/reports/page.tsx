
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  CartesianGrid 
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { Loader2, ShieldAlert, TrendingUp, Landmark, Monitor } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { subDays, subMonths, startOfDay, format, isAfter, eachDayOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth } from "date-fns";

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

  const filterStartDate = useMemo(() => {
    const now = new Date();
    if (timeFilter === "weekly") return subDays(now, 7);
    if (timeFilter === "monthly") return subMonths(now, 1);
    if (timeFilter === "yearly") return subMonths(now, 12);
    return subDays(now, 7);
  }, [timeFilter]);

  const usageQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    // We fetch logs since the filter start date for the trend chart
    // Note: In a real production app with massive data, you'd strictly filter here.
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

    // Group by Room (Institutional scale)
    const rooms = logs.reduce((acc: any[], log) => {
      const room = log.roomNumber || "Unknown Room";
      const existing = acc.find(a => a.name === room);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: room, value: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value);

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
    }, []);

    // Usage Trend Logic based on filter
    const now = new Date();
    let trend: { date: string, count: number }[] = [];

    if (timeFilter === "weekly") {
      const days = eachDayOfInterval({ start: filterStartDate, end: now });
      trend = days.map(day => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameDay(d, day);
        }).length;
        return { date: format(day, 'EEE'), count };
      });
    } else if (timeFilter === "monthly") {
      // Group by Week within the month
      const days = eachDayOfInterval({ start: filterStartDate, end: now });
      // To keep it simple but "grouped by week" as requested, we'll use 4-5 buckets
      const weekBuckets: Record<string, number> = {};
      logs.forEach(log => {
        const d = getLogDate(log.timestamp);
        if (!d) return;
        const weekStart = format(startOfWeek(d), 'MMM d');
        weekBuckets[weekStart] = (weekBuckets[weekStart] || 0) + 1;
      });
      trend = Object.entries(weekBuckets).map(([date, count]) => ({ date, count }));
    } else if (timeFilter === "yearly") {
      const months = eachMonthOfInterval({ start: filterStartDate, end: now });
      trend = months.map(month => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameMonth(d, month);
        }).length;
        return { date: format(month, 'MMM'), count };
      });
    }

    return { roomData: rooms, collegeData: colleges, usageTrend: trend };
  }, [logs, timeFilter, filterStartDate]);

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
        timeFilter === type ? "bg-primary text-white" : "text-muted-foreground"
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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Usage Frequency Trends
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Session volume trends across the university</p>
            </div>
            <div className="flex bg-muted/50 p-1 rounded-lg gap-1 self-end sm:self-auto">
              <FilterButton type="weekly" label="Weekly" />
              <FilterButton type="monthly" label="Monthly" />
              <FilterButton type="yearly" label="Yearly" />
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            {usageLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.usageTrend}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0C46A3" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0C46A3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0C46A3', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0C46A3" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsage)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Room Distribution */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-600" />
                Room Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.roomData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0C46A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement by Office */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Office Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.collegeData} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#47C1EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
