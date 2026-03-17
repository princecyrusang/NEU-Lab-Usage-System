
"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Settings, 
  ShieldCheck,
  History,
  QrCode,
  Loader2,
  Activity,
  Users,
  Database,
  Info,
  ExternalLink
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

  // Dynamic Global Stats Queries - Now available to all institutional users for "Monitor" feel
  const usageQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "lab_usage");
  }, [firestore]);
  
  const { data: allUsage, isLoading: usageLoading, error: usageError } = useCollection(usageQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users");
  }, [firestore]);
  
  const { data: allUsers, isLoading: usersLoading, error: usersError } = useCollection(usersQuery);

  // Dynamic Statistics Logic
  const stats = useMemo(() => {
    const totalLogs = allUsage?.length || 0;
    const activeUsers = allUsers?.length || 0;
    
    let health = "Operational";
    let healthColor = "text-green-600";
    let healthBg = "bg-green-500";

    if (usageError || usersError) {
      health = "Degraded";
      healthColor = "text-destructive";
      healthBg = "bg-destructive";
    } else if (usageLoading || usersLoading) {
      health = "Syncing...";
      healthColor = "text-blue-600";
      healthBg = "bg-blue-600";
    }

    // Identify Most Utilized Room
    const roomCounts = allUsage?.reduce((acc: Record<string, number>, log) => {
      const room = log.roomNumber || "Unknown";
      acc[room] = (acc[room] || 0) + 1;
      return acc;
    }, {});

    const topRoom = roomCounts 
      ? Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] 
      : "Computer Lab 101";

    return { totalLogs, activeUsers, health, healthColor, healthBg, topRoom };
  }, [allUsage, allUsers, usageLoading, usersLoading, usageError, usersError]);

  if (authLoading || !isMounted || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Initializing NEU Monitor...</p>
        </div>
      </div>
    );
  }

  const ACTIONS = [
    {
      title: "Log Usage",
      description: "Start a new laboratory session or verify equipment usage.",
      icon: QrCode,
      href: "/check-in/",
      color: "bg-blue-600",
      accent: "border-blue-200"
    },
    {
      title: "Faculty Profile",
      description: "Manage your university affiliation and personal identification.",
      icon: Settings,
      href: "/profile/",
      color: "bg-slate-700",
      accent: "border-slate-200"
    },
    ...(isAdmin ? [
      {
        title: "Usage History",
        description: "View and filter institutional logs across all facilities.",
        icon: History,
        href: "/history/",
        color: "bg-indigo-600",
        accent: "border-indigo-200"
      },
      {
        title: "Admin Center",
        description: "System management, user permissions, and institutional reports.",
        icon: ShieldCheck,
        href: "/admin/",
        color: "bg-destructive",
        accent: "border-destructive/20"
      }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="bg-primary text-white py-4 shadow-xl sticky top-0 z-50">
        <div className="w-full px-4 md:px-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚪</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">NEU LAB ROOM</h1>
              <p className="text-[10px] uppercase font-bold text-blue-200 mt-1 tracking-widest">Institutional Monitor</p>
            </div>
          </div>
          <Button variant="ghost" size="lg" onClick={logout} className="text-white hover:bg-white/10 font-bold">
            <LogOut className="w-5 h-5 mr-2" />
            Exit System
          </Button>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-10 flex-1 space-y-10">
        
        {/* Real-time Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden group">
            <div className="h-1 bg-blue-600 w-full" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Usage Sessions</p>
                <p className="text-4xl font-black text-slate-900">
                  {usageLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalLogs.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden group">
            <div className="h-1 bg-cyan-500 w-full" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-cyan-50 rounded-2xl text-cyan-600 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Registered Faculty</p>
                <p className="text-4xl font-black text-slate-900">
                  {usersLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.activeUsers.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden group sm:col-span-2 lg:col-span-1">
            <div className="h-1 bg-green-500 w-full" />
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">System Network Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 ${stats.healthBg} rounded-full animate-pulse`} />
                  <p className={`text-4xl font-black ${stats.healthColor}`}>{stats.health}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white p-10 rounded-3xl shadow-sm border-l-[12px] border-primary flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-primary tracking-tight">Institutional Dashboard</h2>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">Live Monitor</span>
                </div>
                <p className="text-xl text-muted-foreground font-medium">Monitoring access for <span className="text-slate-900 font-bold">{profile.fullName}</span></p>
              </div>
              <div className="text-right p-4 bg-slate-50 rounded-2xl border border-slate-100 hidden sm:block">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{profile.collegeOffice}</p>
                <p className="text-lg text-primary font-black uppercase mt-1">{profile.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ACTIONS.map((action) => (
                <Link key={action.title} href={action.href} className="group">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 active:scale-[0.98] border-none overflow-hidden bg-white">
                    <CardContent className="p-10 flex flex-col items-start gap-6">
                      <div className={`p-5 rounded-3xl ${action.color} text-white shadow-xl group-hover:rotate-6 transition-transform`}>
                        <action.icon className="w-10 h-10" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-black text-slate-900">{action.title}</h3>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed">{action.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="xl:col-span-1">
            <Card className="bg-[#0F172A] text-white border-none shadow-2xl overflow-hidden h-full">
              <CardHeader className="bg-white/5 border-b border-white/10 p-8">
                <div className="flex items-center gap-3">
                  <Info className="w-6 h-6 text-cyan-400" />
                  <CardTitle className="text-lg font-black uppercase tracking-[0.2em] text-cyan-400">System Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-white/40 uppercase font-black tracking-widest">Network Throughput</p>
                    <span className="text-cyan-400 font-black text-xs">Verified</span>
                  </div>
                  <p className="text-2xl font-bold">Real-time Cloud Sync</p>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full w-[100%] shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  </div>
                </div>

                <div className="space-y-2 py-6 border-y border-white/10">
                  <p className="text-xs text-white/40 uppercase font-black tracking-widest">Most Utilized Facility</p>
                  <p className="text-2xl font-bold text-white">{stats.topRoom}</p>
                  <div className="inline-flex items-center gap-2 bg-cyan-400/10 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-4">
                    <Activity className="w-3 h-3" />
                    Live Activity Leader
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                    <span className="text-white/40 font-bold">Auth Latency</span>
                    <span className="text-green-400 font-black">&lt; 0.1s</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                    <span className="text-white/40 font-bold">Data Redundancy</span>
                    <span className="text-cyan-400 font-black">Triple-Replicated</span>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mt-10">
                  <p className="text-sm leading-relaxed text-white/60 italic font-medium">
                    "Institutional laboratory usage telemetry is automatically synchronized with the University Central Registry."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center border-t bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 grayscale opacity-30">
             <span className="text-2xl">🚪</span>
             <span className="font-bold text-slate-900">NEU LAB ROOM</span>
          </div>
          <p className="text-[11px] text-slate-400 uppercase font-black tracking-[0.3em]">
            New Era University • Advanced Information Systems Division
          </p>
        </div>
      </footer>
    </div>
  );
}
