
"use client";

import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { query, where, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserX, CalendarDays, History, Loader2 } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { useMemo, useState, useEffect } from "react";

/**
 * AdminDashboard Component
 * 
 * Displays key library metrics. Uses an isMounted guard to prevent
 * hydration mismatches between server and client date calculations.
 */
export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use useMemo for date bounds to prevent hydration mismatches
  const { todayStart, weekStart, monthStart } = useMemo(() => {
    const now = new Date();
    return {
      todayStart: startOfDay(now),
      weekStart: startOfWeek(now),
      monthStart: startOfMonth(now),
    };
  }, []);

  // Strict role check for safety
  const isConfirmedAdmin = !authLoading && profile?.role === "admin";

  // Query all users
  const usersQuery = useMemoFirebase(() => {
    if (!isConfirmedAdmin || !firestore) return null;
    return collection(firestore, "users");
  }, [firestore, isConfirmedAdmin]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  // Query blocked users
  const blockedUsersQuery = useMemoFirebase(() => {
    if (!isConfirmedAdmin || !firestore) return null;
    return query(collection(firestore, "users"), where("isBlocked", "==", true));
  }, [firestore, isConfirmedAdmin]);
  const { data: blockedUsers, isLoading: blockedLoading } = useCollection(blockedUsersQuery);

  // Query visits
  const visitsQuery = useMemoFirebase(() => {
    if (!isConfirmedAdmin || !firestore) return null;
    return collection(firestore, "visits");
  }, [firestore, isConfirmedAdmin]);
  const { data: allVisits, isLoading: visitsLoading } = useCollection(visitsQuery);

  if (authLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isConfirmedAdmin) return null;

  if (usersLoading || blockedLoading || visitsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const validUsers = users?.filter(u => u.email?.toLowerCase().endsWith("@neu.edu.ph")) || [];

  const stats = {
    today: allVisits?.filter(v => {
      const date = v.timestamp?.toDate?.();
      return date && date >= todayStart;
    }).length || 0,
    week: allVisits?.filter(v => {
      const date = v.timestamp?.toDate?.();
      return date && date >= weekStart;
    }).length || 0,
    month: allVisits?.filter(v => {
      const date = v.timestamp?.toDate?.();
      return date && date >= monthStart;
    }).length || 0,
    blocked: blockedUsers?.length || 0,
  };

  const statCards = [
    { label: "Visitors Today", value: stats.today, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Visitors This Week", value: stats.week, icon: History, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Visitors This Month", value: stats.month, icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { label: "Blocked Users", value: stats.blocked, icon: UserX, color: "text-red-600", bg: "bg-red-100" },
  ];

  const recentVisits = allVisits
    ?.filter(v => !!v.timestamp?.toDate)
    .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <AdminPageHeader 
        title="System Overview" 
        description="Real-time library usage statistics and administrative controls." 
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Recent Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVisits && recentVisits.length > 0 ? (
                recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{visit.fullName || "Unknown Visitor"}</p>
                      <p className="text-xs text-muted-foreground">{visit.reason || "No reason specified"}</p>
                    </div>
                    <p className="text-xs font-medium text-primary">
                      {visit.timestamp?.toDate ? visit.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent visits recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-sm text-muted-foreground">Registered Users</span>
                 <span className="font-bold">{validUsers.length}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-sm text-muted-foreground">Active Sessions</span>
                 <span className="font-bold">{stats.today}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-sm text-muted-foreground">Library Capacity Utilization</span>
                 <span className="font-bold">Normal</span>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
