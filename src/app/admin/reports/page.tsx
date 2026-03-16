
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/context/auth-context";
import { Loader2, ShieldAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COLORS = ['#0C46A3', '#47C1EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
    const days = logs.reduce((acc: any[], log) => {
      const dateObj = getLogDate(log.timestamp);
      if (!dateObj || isNaN(dateObj.getTime())) return acc;
      
      const dateKey = dateObj.toISOString().split('T')[0];
      const existing = acc.find(a => a.date === dateKey);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date: dateKey, count: 1 });
      }
      return acc;
    }, []).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return { roomData: rooms, collegeData: colleges, usageByDay: days };
  }, [logs]);

  const { roomData, collegeData, usageByDay } = stats;

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
              <p className="text-muted-foreground">
                Institutional reports are only accessible to system administrators.
              </p>
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
    <div className="space-y-8">
      <AdminPageHeader 
        title="Institutional Reports" 
        description="Data analysis of NEU LAB ROOM utilization and faculty engagement." 
      />

      {usageLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Room Utilization Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roomData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Usage Frequency Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageByDay}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0C46A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle>Engagement by College / Department</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collegeData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={180} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#47C1EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
