
"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Settings, 
  ShieldCheck,
  History,
  ChevronRight,
  QrCode,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LaboratoryDashboard() {
  const { profile, logout, loading } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  // Resilience: If profile is missing after initial load, retry check
  useEffect(() => {
    if (!loading && !profile && retryCount < 5) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1500); // Wait 1.5s then retry
      return () => clearTimeout(timer);
    }
  }, [loading, profile, retryCount]);

  if (loading || (!profile && retryCount < 5)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="space-y-2">
            <p className="text-lg font-bold text-primary">NEU LAB ROOM</p>
            <p className="text-sm text-muted-foreground animate-pulse">
              {retryCount > 0 ? "Finalizing institutional profile..." : "Verifying credentials..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Final fallback if profile still missing after retries
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="space-y-6 max-w-sm">
          <div className="text-6xl">🚪</div>
          <h2 className="text-2xl font-bold text-primary">Setup in Progress</h2>
          <p className="text-muted-foreground">We are finalizing your account details. This usually takes a moment.</p>
          <Button onClick={() => window.location.reload()} className="w-full py-6 text-lg font-bold">
            Refresh Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === "Admin";

  const ACTIONS = [
    {
      title: "Log Usage",
      description: "Scan your ID to record entry and start session.",
      icon: QrCode,
      href: "/check-in/",
      color: "bg-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Faculty Profile",
      description: "Manage your university affiliation details.",
      icon: Settings,
      href: "/profile/",
      color: "bg-slate-600",
      borderColor: "border-slate-200",
    }
  ];

  return (
    <div className="min-h-screen bg-[#EEF1F6] flex flex-col">
      <header className="bg-primary text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚪</span>
            <h1 className="text-xl font-bold tracking-tight">NEU LAB ROOM</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={logout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border-l-8 border-primary">
            <h2 className="text-3xl font-bold text-primary">Welcome, {profile.fullName.split(' ')[0]}!</h2>
            <p className="text-muted-foreground mt-1">Institutional monitoring system for laboratory facilities.</p>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-accent/10 border-b">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  {profile.fullName?.[0] || "U"}
                </div>
                <div>
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="font-medium text-primary">
                    {profile.collegeOffice} • {profile.role}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Row: Common Actions */}
            {ACTIONS.map((action) => (
              <Link key={action.title} href={action.href} className="group h-full">
                <Card className={`h-full transition-all hover:shadow-lg border-l-4 ${action.borderColor} active:scale-[0.98]`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${action.color} text-white mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Bottom Row: Admin-Specific Actions */}
            {isAdmin && (
              <>
                <Link href="/history/" className="group h-full">
                  <Card className="h-full transition-all hover:shadow-lg border-l-4 border-indigo-200 active:scale-[0.98]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-xl bg-indigo-600 text-white mb-4 shadow-md group-hover:scale-110 transition-transform">
                          <History className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Usage History</h3>
                      <p className="text-sm text-muted-foreground">Review institutional laboratory usage logs.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/" className="group h-full">
                  <Card className="h-full transition-all hover:shadow-lg border-l-4 border-destructive/30 active:scale-[0.98] bg-destructive/5">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-xl bg-destructive text-white mb-4 shadow-md group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-destructive/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-lg font-bold text-destructive mb-1">Admin Center</h3>
                      <p className="text-sm text-muted-foreground">Manage users and view institutional data reports.</p>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-12 bg-white/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">New Era University • NEU LAB ROOM Monitoring System</p>
        </div>
      </footer>
    </div>
  );
}
