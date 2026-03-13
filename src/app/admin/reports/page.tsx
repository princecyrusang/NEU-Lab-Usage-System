
"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/context/auth-context";
import { Loader2, FlaskConical } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";

const COLORS = ['#0C46A3', '#47C1EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function LaboratoryReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isAdmin = profile?.role === "admin";

  const usageQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return collection(firestore, "lab_usage");
  }, [firestore, isAdmin]);
  const { data: logs, isLoading: usageLoading } = useCollection(usageQuery);

  const analyticsData = useMemo(() => {
    if (!logs) return { roomData: [], collegeData: [], usageByDay: [] };

    // Group by Room
    const roomData = logs.reduce((acc: any[], log) => {
      if (!log.roomNumber) return acc;
      const existing = acc.find(a => a.name === log.roomNumber);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: log.roomNumber, value: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value);

    // Group by College/Department
    const collegeData = logs.reduce((acc: any[], log) => {
      if (!log.collegeOffice) return acc;
      const existing = acc.find(a => a.name === log.collegeOffice);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: log.collegeOffice, value: 1 });
      }
      return acc;
    }, []);

    // Usage per day
    const usageByDay = logs.reduce((acc: any[], log) => {
      const dateObj = log.timestamp?.toDate?.();
      if (!dateObj) return acc;
      
      const dateKey = dateObj.toISOString().split('T')[0];
      const existing = acc.find(a => a.date === dateKey);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date: dateKey, count: 1 });
      }
      return acc;
    }, []).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return { roomData, collegeData, usageByDay };
  }, [logs]);

  if (authLoading || usageLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const { roomData, collegeData, usageByDay } = analyticsData;

  return (
    <div className="space-y-8">
      <AdminPageHeader 
        title="Institutional Laboratory Reports" 
        description="Data analysis of room utilization, faculty activity, and departmental engagement." 
      />

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
    </div>
  );
}
