"use client";

import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { query, collection, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FlaskConical, CalendarDays, History, Loader2, Search } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { todayStart, weekStart, monthStart } = useMemo(() => {
    const now = new Date();
    return {
      todayStart: startOfDay(now),
      weekStart: startOfWeek(now),
      monthStart: startOfMonth(now),
    };
  }, []);

  const isConfirmedAdmin = !authLoading && profile?.role === "Admin";

  const usageQuery = useMemoFirebase(() => {
    if (!isConfirmedAdmin || !firestore) return null;
    return query(collection(firestore, "lab_usage"), orderBy("timestamp", "desc"));
  }, [firestore, isConfirmedAdmin]);
  const { data: allUsage, isLoading: usageLoading } = useCollection(usageQuery);

  const stats = useMemo(() => {
    if (!allUsage) return { today: 0, week: 0, month: 0, total: 0 };
    
    const getLogDate = (ts: any) => {
      if (ts?.toDate) return ts.toDate();
      if (typeof ts === 'string') return new Date(ts);
      return new Date(ts);
    };

    return {
      today: allUsage.filter(v => getLogDate(v.timestamp) >= todayStart).length,
      week: allUsage.filter(v => getLogDate(v.timestamp) >= weekStart).length,
      month: allUsage.filter(v => getLogDate(v.timestamp) >= monthStart).length,
      total: allUsage.length
    };
  }, [allUsage, todayStart, weekStart, monthStart]);

  const filteredLogs = useMemo(() => {
    if (!allUsage) return [];
    let filtered = allUsage;

    const getLogDate = (ts: any) => {
      if (ts?.toDate) return ts.toDate();
      if (typeof ts === 'string') return new Date(ts);
      return new Date(ts);
    };

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateRange !== "all") {
      const boundary = dateRange === "today" ? todayStart : dateRange === "week" ? weekStart : monthStart;
      filtered = filtered.filter(log => getLogDate(log.timestamp) >= boundary);
    }

    return filtered;
  }, [allUsage, searchTerm, dateRange, todayStart, weekStart, monthStart]);

  if (authLoading || !isMounted || usageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isConfirmedAdmin) return null;

  const statCards = [
    { label: "Today's Usage", value: stats.today, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Weekly Sessions", value: stats.week, icon: History, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Monthly Utilization", value: stats.month, icon: FlaskConical, color: "text-green-600", bg: "bg-green-100" },
    { label: "Total Institutional Logs", value: stats.total, icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader 
        title="NEU LAB ROOM Statistics" 
        description="Monitor faculty utilization of NEU LAB ROOM facilities and specialized equipment." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by Professor Name or Room..." 
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-[200px] h-12">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Detailed Usage Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  const isValidDate = !isNaN(logDate.getTime());

                  return (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {log.fullName?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-bold">{log.fullName}</p>
                          <p className="text-xs text-muted-foreground">{log.roomNumber} • {log.collegeOffice}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {isValidDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isValidDate ? logDate.toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                   <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p>No usage logs found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}