
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
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

export default function LaboratoryReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isAdmin = profile?.role === "Admin";

  const usageQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return collection(firestore, "lab_usage");
  }, [firestore, isAdmin]);
  
  const { data: logs, isLoading: usageLoading } = useCollection(usageQuery);

  const stats = useMemo(() => {
    if (!logs) return { roomData: [], collegeData: [], usageByDay: [] };

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

    // Usage per day
    const dayMap: Record<string, number> = {};
    logs.forEach((log) => {
      const dateObj = getLogDate(log.timestamp);
      if (!dateObj || isNaN(dateObj.getTime())) return;
      const dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[dateKey] = (dayMap[dateKey] || 0) + 1;
    });

    const usageByDay = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { roomData: rooms, collegeData: colleges, usageByDay };
  }, [logs]);

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

  return (
    <div className="space-y-8 pb-10">
      <AdminPageHeader 
        title="Institutional Reports" 
        description="Data analysis of NEU LAB ROOM utilization and faculty engagement trends." 
      />

      {usageLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Main Trend Chart */}
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Usage Frequency Trends
                </CardTitle>
                <p className="text-xs text-muted-foreground font-medium">Daily session volume across all facilities</p>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.usageByDay}>
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
      )}
    </div>
  );
}
