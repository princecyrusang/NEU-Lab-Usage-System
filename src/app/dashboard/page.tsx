
"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Settings, 
  ShieldCheck,
  History,
  ChevronRight,
  QrCode,
  Loader2,
  Activity,
  Users,
  Database,
  Info
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

export default function LaboratoryDashboard() {
  const { profile, logout, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = profile?.role === "Admin";

  // Dynamic Stats Queries
  const usageQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "lab_usage");
  }, [firestore, isAdmin]);
  const { data: allUsage } = useCollection(usageQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, isAdmin]);
  const { data: allUsers } = useCollection(usersQuery);

  const stats = useMemo(() => ({
    totalLogs: allUsage?.length || 0,
    activeUsers: allUsers?.length || 0,
    health: "Operational"
  }), [allUsage, allUsers]);

  if (authLoading || !isMounted || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Initializing Monitor...</p>
        </div>
      </div>
    );
  }

  const ACTIONS = [
    {
      title: "Log Usage",
      description: "Start session.",
      icon: QrCode,
      href: "/check-in/",
      color: "bg-blue-600",
    },
    {
      title: "Profile",
      description: "Manage details.",
      icon: Settings,
      href: "/profile/",
      color: "bg-slate-600",
    },
    ...(isAdmin ? [
      {
        title: "History",
        description: "View logs.",
        icon: History,
        href: "/history/",
        color: "bg-indigo-600",
      },
      {
        title: "Admin",
        description: "System control.",
        icon: ShieldCheck,
        href: "/admin/",
        color: "bg-destructive",
      }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      <header className="bg-primary text-white py-3 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚪</span>
            <h1 className="text-lg font-bold tracking-tight">NEU LAB ROOM</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl flex-1">
        <div className="space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Usage</p>
                  <p className="text-2xl font-black">{stats.totalLogs}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered Faculty</p>
                  <p className="text-2xl font-black">{stats.activeUsers}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">System Status</p>
                  <p className="text-2xl font-black text-green-600">{stats.health}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Action Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-primary">System Monitor</h2>
                  <p className="text-sm text-muted-foreground">Welcome back, {profile.fullName}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-muted-foreground uppercase">{profile.collegeOffice}</p>
                  <p className="text-xs text-primary font-bold">{profile.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {ACTIONS.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <Card className="h-full hover:shadow-md transition-all active:scale-95 border-none">
                      <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                        <div className={`p-3 rounded-full ${action.color} text-white shadow-sm`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{action.title}</h3>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: System Insights */}
            <Card className="bg-[#1A1F2C] text-white border-none shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-cyan-400">System Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-xs text-white/50 uppercase font-bold">Peak Engagement</p>
                  <p className="text-lg font-medium">Weekdays (09:00 - 14:00)</p>
                  <div className="h-1.5 bg-white/10 rounded-full mt-2">
                    <div className="h-full bg-cyan-400 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-white/50 uppercase font-bold">Top Facility</p>
                  <p className="text-lg font-medium">Computer Lab 101</p>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase mt-1">Institutional Leader</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/50">Storage Utilization</span>
                    <span className="text-green-400 font-bold">0.02%</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-[10px] leading-relaxed text-white/70 italic">
                    "Laboratory usage data is synchronized across all university networks in real-time."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          New Era University • NEU LAB ROOM Monitor v2.5
        </p>
      </footer>
    </div>
  );
}
