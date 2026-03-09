
"use client";

import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/context/auth-context";

const COLORS = ['#0C46A3', '#47C1EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const { profile } = useAuth();
  const firestore = useFirestore();
  
  const isAdmin = profile?.role === "admin";

  // Query from TOP-LEVEL visits collection with defensive guard
  const visitsQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return collection(firestore, "visits");
  }, [firestore, isAdmin]);
  const { data: visits } = useCollection(visitsQuery);

  if (!isAdmin) return null;

  // Group by Reason
  const reasonData = visits?.reduce((acc: any[], visit) => {
    const existing = acc.find(a => a.name === visit.reason);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: visit.reason, value: 1 });
    }
    return acc;
  }, []) || [];

  // Group by College
  const collegeData = visits?.reduce((acc: any[], visit) => {
    const existing = acc.find(a => a.name === visit.collegeOffice);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: visit.collegeOffice, value: 1 });
    }
    return acc;
  }, []) || [];

  // Visits per day (last 7 days simplified)
  const visitsByDay = visits?.reduce((acc: any[], visit) => {
    const date = visit.timestamp?.toDate().toLocaleDateString();
    const existing = acc.find(a => a.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Library Reports</h1>
        <p className="text-muted-foreground">Visual data analysis of library visits and user demographics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Reason for Visiting Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reasonData.map((entry, index) => (
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
            <CardTitle>Visits per Day</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsByDay}>
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
            <CardTitle>Visitors per College / Office</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collegeData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
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
