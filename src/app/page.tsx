
"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  GraduationCap, 
  User, 
  ClipboardList, 
  History, 
  Settings, 
  ShieldCheck,
  Building,
  Mail,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function HomeDashboard() {
  const { profile, logout, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const QUICK_ACTIONS = [
    {
      title: "Log Library Visit",
      description: "Record your entry to the library facilities.",
      icon: ClipboardList,
      href: "/check-in",
      color: "bg-blue-500",
      textColor: "text-blue-500",
      borderColor: "border-blue-200"
    },
    {
      title: "Visit History",
      description: "View your past library visit records.",
      icon: History,
      href: "/history",
      color: "bg-indigo-500",
      textColor: "text-indigo-500",
      borderColor: "border-indigo-200"
    },
    {
      title: "Profile Settings",
      description: "Manage your institutional affiliation details.",
      icon: Settings,
      href: "/onboarding",
      color: "bg-slate-500",
      textColor: "text-slate-500",
      borderColor: "border-slate-200"
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU Library</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={logout}
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">Welcome, {profile.fullName.split(' ')[0]}!</h2>
            <p className="text-muted-foreground">What would you like to do today?</p>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-accent/10 border-b">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-inner">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {profile.collegeOffice}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.title} href={action.href} className="group">
                <Card className={`h-full transition-all hover:shadow-lg border-l-4 ${action.borderColor} active:scale-95`}>
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

            {profile.role === "admin" && (
              <Link href="/admin" className="group lg:col-span-1">
                <Card className="h-full transition-all hover:shadow-lg border-l-4 border-red-200 active:scale-95 bg-red-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-red-600 text-white mb-4 shadow-md group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Admin Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Manage users, view global analytics, and generate reports.</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-12 bg-white/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">New Era University Library • Institutional Access Portal</p>
        </div>
      </footer>
    </div>
  );
}
