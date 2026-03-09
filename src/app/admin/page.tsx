
"use client";

import { useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { query, where, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserX, CalendarDays, History } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useAuth } from "@/context/auth-context";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const firestore = useFirestore();
  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek(new Date());
  const monthStart = startOfMonth(new Date());

  // Defensive guards for admin-only queries
  const isAdmin = profile?.role === "admin";

  // Query all users
  const usersQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return collection(firestore, "users");
  }, [firestore, isAdmin]);
  const { data: users } = useCollection(usersQuery);

  // Query blocked users
  const blockedUsersQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return query(collection(firestore, "users"), where("isBlocked", "==", true));
  }, [firestore, isAdmin]);
  const { data: blockedUsers } = useCollection(blockedUsersQuery);

  // Query visits from TOP-LEVEL collection
  const visitsQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return collection(firestore, "visits");
  }, [firestore, isAdmin]);
  const { data: allVisits } = useCollection(visitsQuery);

  if (!isAdmin) return null;

  const stats = {
    today: allVisits?.filter(v => v.timestamp?.toDate() >= todayStart).length || 0,
    week: allVisits?.filter(v => v.timestamp?.toDate() >= weekStart).length || 0,
    month: allVisits?.filter(v => v.timestamp?.toDate() >= monthStart).length || 0,
    blocked: blockedUsers?.length || 0,
  };

  const statCards = [
    { label: "Visitors Today", value: stats.today, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Visitors This Week", value: stats.week, icon: History, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Visitors This Month", value: stats.month, icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { label: "Blocked Users", value: stats.blocked, icon: UserX, color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">System Overview</h1>
        <p className="text-muted-foreground">Real-time library usage statistics.</p>
      </div>

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
              {allVisits?.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()).slice(0, 5).map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{visit.fullName}</p>
                    <p className="text-xs text-muted-foreground">{visit.reason}</p>
                  </div>
                  <p className="text-xs font-medium text-primary">
                    {visit.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )) || <p className="text-sm text-muted-foreground">No recent visits recorded.</p>}
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
                 <span className="font-bold">{users?.length || 0}</span>
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
