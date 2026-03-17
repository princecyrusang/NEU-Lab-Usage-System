
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  Bar,
  BarChart,
  ResponsiveContainer, 
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { Loader2, ShieldAlert, TrendingUp, Landmark, Monitor } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  format, 
  eachDayOfInterval, 
  eachMonthOfInterval, 
  eachYearOfInterval,
  isSameDay, 
  isSameMonth,
  isSameYear,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subYears
} from "date-fns";

type FilterType = "weekly" | "monthly" | "yearly";

const CICS_LABS = Array.from({ length: 10 }, (_, i) => `Computer Lab ${101 + i}`);

const CICS_PROGRAMS_REGISTRY = [
  { id: "BSIT", name: "BSIT" },
  { id: "BSCS", name: "BSCS" },
  { id: "BSIS", name: "BSIS" },
  { id: "BSEMC", name: "BSEMC" },
];

export default function CICSReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [timeFilter, setTimeFilter] = useState<FilterType>("weekly");

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isAdmin = profile?.role === "Admin";

  const { filterStartDate, filterEndDate, subtitle } = useMemo(() => {
    const now = new Date();
    let start, end, sub;

    if (timeFilter === "weekly") {
      start = startOfWeek(now, { weekStartsOn: 0 });
      end = endOfWeek(now, { weekStartsOn: 0 });
      sub = `Usage for current week: ${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
    } else if (timeFilter === "monthly") {
      start = startOfYear(now);
      end = endOfYear(now);
      sub = `CICS Monthly trend for ${format(now, 'yyyy')}`;
    } else {
      start = startOfYear(subYears(now, 9));
      end = endOfYear(now);
      sub = `CICS 10-Year Growth Overview`;
    }
    
    return { 
      filterStartDate: start, 
      filterEndDate: end,
      subtitle: sub
    };
  }, [timeFilter]);

  const usageQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return query(
      collection(firestore, "lab_usage"),
      where("timestamp", ">=", filterStartDate.toISOString()),
      where("timestamp", "<=", filterEndDate.toISOString()),
      orderBy("timestamp", "asc")
    );
  }, [firestore, isAdmin, filterStartDate, filterEndDate]);
  
  const { data: logs, isLoading: usageLoading } = useCollection(usageQuery);

  const stats = useMemo(() => {
    if (!logs) return { roomData: [], programData: [], usageTrend: [] };

    const getLogDate = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate();
      return new Date(ts);
    };

    // 1. Normalized CICS Lab Utilization (Computer Lab 101-110)
    const roomMap = CICS_LABS.map(name => ({ name, value: 0 }));
    logs.forEach(log => {
      const room = roomMap.find(r => r.name === log.roomNumber);
      if (room) room.value++;
    });

    // 2. Normalized Engagement by CICS Program (BSIT, BSCS, BSIS, BSEMC)
    const programMap = CICS_PROGRAMS_REGISTRY.map(prog => ({ 
      name: prog.name, 
      value: 0 
    }));

    logs.forEach(log => {
      const matchingProgram = programMap.find(p => 
        log.collegeOffice?.toUpperCase().includes(p.name)
      );
      if (matchingProgram) matchingProgram.value++;
    });

    // 3. Temporal Usage Trends
    let trend: { date: string, count: number, fullDate: string }[] = [];

    if (timeFilter === "weekly") {
      const days = eachDayOfInterval({ start: filterStartDate, end: filterEndDate });
      trend = days.map(day => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameDay(d, day);
        }).length;
        return { 
          date: format(day, 'EEE'), 
          count,
          fullDate: format(day, 'PPPP')
        };
      });
    } else if (timeFilter === "monthly") {
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
    } else if (timeFilter === "yearly") {
      const years = eachYearOfInterval({ start: filterStartDate, end: filterEndDate });
      trend = years.map(year => {
        const count = logs.filter(log => {
          const d = getLogDate(log.timestamp);
          return d && isSameYear(d, year);
        }).length;
        return { 
          date: format(year, 'yyyy'), 
          count,
          fullDate: `Year ${format(year, 'yyyy')}`
        };
      });
    }

    return { 
      roomData: roomMap, 
      programData: programMap, 
      usageTrend: trend 
    };
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
              <h3 className="text-2xl font-bold text-destructive">Restricted Admin Access</h3>
              <p className="text-muted-foreground">CICS Institutional reports are restricted to laboratory administrators.</p>
            </div>
            <Link href="/dashboard" className="block">
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
        title="CICS Institutional Reports" 
        description="Detailed analytics of Informatics and Computing Studies laboratory utilization." 
      />

      <div className="grid gap-6">
        {/* Temporal Usage Trends */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 font-black text-slate-900">
                <TrendingUp className="w-6 h-6 text-primary" />
                CICS Usage Trends
              </CardTitle>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">
                {subtitle}
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
                      <stop offset="5%" stopColor="#0C46A3" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0C46A3" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700 }}
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
          {/* Room Utilization */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-cyan-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-black text-slate-800">
                <Monitor className="w-5 h-5 text-cyan-600" />
                CICS Lab Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.roomData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: "#64748B" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                  <Tooltip 
                     cursor={{ fill: '#f1f5f9' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.roomData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#0891b2' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement by CICS Program */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-indigo-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-black text-slate-800">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Engagement by CICS Program
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats.programData} 
                  layout="vertical" 
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fontSize: 12, fontWeight: 900, fill: "#1E293B" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                     cursor={{ fill: '#f1f5f9' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.programData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.value > 0 ? (index % 2 === 0 ? '#0C46A3' : '#47C1EB') : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
