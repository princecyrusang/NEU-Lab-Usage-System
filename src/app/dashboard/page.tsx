
"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LogOut, 
  Settings, 
  ShieldCheck,
  History,
  QrCode,
  Loader2,
  Users,
  Database,
  Building2,
  UserCircle2,
  Clock,
  AlertTriangle,
  DoorClosed,
  DoorOpen
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

const COLLEGES_AND_OFFICES = [
  "College of Arts and Sciences",
  "College of Business Administration",
  "College of Computer Studies",
  "College of Education",
  "College of Engineering and Architecture",
  "College of Music",
  "College of Nursing",
  "College of Communication",
  "College of Criminology",
  "Center for Medical and Health Sciences",
  "Graduate School",
  "College of Law",
  "Office of the Registrar",
  "Office of Admissions",
  "Other Administrative Offices",
];

const LAB_ROOMS = [
  "Computer Lab 101",
  "Computer Lab 102",
  "Physics Lab 103",
  "Chemistry Lab 104",
  "Biology Lab 105",
  "Multimedia Room 106"
];

function LiveTimer({ startTime }: { startTime: any }) {
  const [elapsed, setElapsed] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const start = startTime?.toDate ? startTime.toDate() : new Date(startTime);
    
    const update = () => {
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      
      // Warning if > 3 hours
      setIsWarning(diffHrs >= 3);
      
      setElapsed(`${diffHrs}h ${diffMins}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className={`flex items-center gap-1.5 font-black text-sm ${isWarning ? 'text-destructive animate-pulse' : 'text-primary'}`}>
      {isWarning && <AlertTriangle className="w-4 h-4" />}
      <Clock className="w-4 h-4" />
      {elapsed}
    </div>
  );
}

export default function LaboratoryDashboard() {
  const { profile, user, logout, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isStopping, setIsStopping] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = profile?.role === "Admin";

  const activeSessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "active_sessions");
  }, [firestore]);
  
  const { data: activeSessions, isLoading: sessionsLoading } = useCollection(activeSessionsQuery);

  const stats = useMemo(() => {
    const totalActive = activeSessions?.length || 0;
    const availableRooms = LAB_ROOMS.length - totalActive;
    return { totalActive, availableRooms };
  }, [activeSessions]);

  const handleStopSession = async (session: any) => {
    if (!firestore) return;
    setIsStopping(session.id);
    
    try {
      const start = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
      const now = new Date();
      const diffMins = Math.floor((now.getTime() - start.getTime()) / 60000);

      // 1. Add to history
      await addDoc(collection(firestore, "lab_usage"), {
        ...session,
        endTime: now.toISOString(),
        durationMinutes: diffMins,
        timestamp: now.toISOString() // for reports
      });

      // 2. Delete from active
      await deleteDoc(doc(firestore, "active_sessions", session.id));

      toast({
        title: "Session Ended",
        description: `Laboratory ${session.roomId} is now available.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session. Please try again.",
      });
    } finally {
      setIsStopping(null);
    }
  };

  const handleCompleteSetup = async () => {
    if (!selectedOffice || !user || !firestore) return;
    setIsUpdatingProfile(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        collegeOffice: selectedOffice,
        isSetupComplete: true,
      });
      toast({ title: "Setup Complete" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Setup Failed" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (authLoading || !isMounted || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative">
      {!profile.isSetupComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-lg shadow-2xl border-none overflow-visible">
            <CardHeader className="space-y-1 pb-8 border-b bg-accent/30 rounded-t-xl">
              <CardTitle className="text-2xl font-bold text-primary">Welcome, {profile.fullName}!</CardTitle>
              <CardDescription>Please identify your university affiliation to continue.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6 overflow-visible">
              <div className="space-y-4">
                <Label className="font-bold">College or Office</Label>
                <Select onValueChange={setSelectedOffice} value={selectedOffice}>
                  <SelectTrigger className="w-full py-8 text-lg border-2">
                    <SelectValue placeholder="Select from registry..." />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {COLLEGES_AND_OFFICES.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCompleteSetup} 
                className="w-full py-8 text-xl font-black bg-primary"
                disabled={isUpdatingProfile || !selectedOffice}
              >
                {isUpdatingProfile ? "Saving..." : "Complete Setup"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="bg-primary text-white py-4 shadow-xl sticky top-0 z-50">
        <div className="w-full px-4 md:px-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚪</span>
            <div>
              <h1 className="text-xl font-bold">NEU LAB ROOM</h1>
              <p className="text-[10px] uppercase font-bold text-blue-200 mt-1">Real-Time Management</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10 font-bold">
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-10 py-10 flex-1 space-y-10">
        
        {/* Quick Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-md bg-white border-l-4 border-blue-600">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl text-primary"><DoorClosed className="w-8 h-8" /></div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Occupied Facilities</p>
                <p className="text-3xl font-black">{stats.totalActive}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white border-l-4 border-green-500">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-green-50 rounded-2xl text-green-600"><DoorOpen className="w-8 h-8" /></div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Available Rooms</p>
                <p className="text-3xl font-black">{stats.availableRooms}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-[#0F172A] text-white lg:col-span-1">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl"><Users className="w-8 h-8 text-cyan-400" /></div>
              <div>
                <p className="text-xs font-bold text-white/40 uppercase">Faculty Network</p>
                <p className="text-3xl font-black text-cyan-400">Institutional Sync Active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          {/* Room Availability Map */}
          <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Database className="w-6 h-6 text-primary" />
                Laboratory Availability Map
              </h2>
              <Link href="/check-in/">
                <Button className="bg-primary shadow-lg font-bold">
                  <QrCode className="w-4 h-4 mr-2" />
                  New Log
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {LAB_ROOMS.map((roomName) => {
                const session = activeSessions?.find(s => s.roomId === roomName);
                const isOccupied = !!session;
                const isMySession = session?.userId === user?.uid;

                return (
                  <Card key={roomName} className={`border-none shadow-md overflow-hidden transition-all duration-300 ${isOccupied ? 'ring-2 ring-destructive/20' : 'hover:shadow-xl'}`}>
                    <div className={`h-2 ${isOccupied ? 'bg-destructive' : 'bg-green-500'}`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">{roomName}</CardTitle>
                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${isOccupied ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                          {isOccupied ? 'Occupied' : 'Available'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isOccupied ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                              {session.fullName?.[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold truncate">{session.fullName}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{session.collegeOffice}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t flex justify-between items-center">
                            <LiveTimer startTime={session.startTime} />
                            {isMySession && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 text-[10px] font-black uppercase"
                                onClick={() => handleStopSession(session)}
                                disabled={isStopping === session.id}
                              >
                                {isStopping === session.id ? "Stopping..." : "End Session"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-300">
                          <DoorOpen className="w-12 h-12 mx-auto opacity-20" />
                          <p className="text-xs mt-2 font-medium">Ready for utilization</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & Navigation Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Link href="/profile/" className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors border-b">
                  <div className="p-3 bg-blue-100 rounded-xl text-primary"><Settings className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold text-sm">Faculty Profile</p>
                    <p className="text-xs text-muted-foreground">Manage identity</p>
                  </div>
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/history/" className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors border-b">
                      <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><History className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-sm">Usage History</p>
                        <p className="text-xs text-muted-foreground">Historical telemetry</p>
                      </div>
                    </Link>
                    <Link href="/admin/" className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors">
                      <div className="p-3 bg-red-100 rounded-xl text-destructive"><ShieldCheck className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-sm">Admin Center</p>
                        <p className="text-xs text-muted-foreground">System control</p>
                      </div>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="p-8 bg-[#0F172A] rounded-3xl text-white space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-widest">
                <Clock className="w-4 h-4" /> System Telemetry
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                "Laboratory occupancy is tracked in real-time. Unauthorized sessions exceeding 3 hours will be flagged for review."
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center border-t bg-white">
        <p className="text-[11px] text-slate-400 uppercase font-black tracking-[0.3em]">
          New Era University • Real-Time Information Systems Division
        </p>
      </footer>
    </div>
  );
}
