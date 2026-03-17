
"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Settings, 
  ShieldCheck,
  History,
  QrCode,
  Loader2,
  Users,
  Database,
  UserCircle2,
  Clock,
  AlertTriangle,
  DoorOpen,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const CICS_PROGRAMS = [
  "BSIT (Bachelor of Science in Information Technology)",
  "BSCS (Bachelor of Science in Computer Science)",
  "BSIS (Bachelor of Science in Information System)",
  "BSEMC (Bachelor of Science in Entertainment and Multimedia Computing)",
];

const LAB_ROOMS = Array.from({ length: 10 }, (_, i) => `Computer Lab ${101 + i}`);

interface LiveTimerProps {
  startTime: any;
  onAutoClose: () => void;
}

function LiveTimer({ startTime, onAutoClose }: LiveTimerProps) {
  const [elapsed, setElapsed] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const start = startTime?.toDate ? startTime.toDate() : new Date(startTime);
    
    const update = () => {
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      
      // Auto-close logic: 3 hours = 10,800,000 ms
      if (diffMs >= 10800000) {
        onAutoClose();
        return;
      }

      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      setIsWarning(diffHrs >= 2); // Warn at 2 hours
      
      setElapsed(`${diffHrs}h ${diffMins}m ${diffSecs}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime, onAutoClose]);

  return (
    <div className={`flex items-center gap-1.5 font-mono font-black text-xs ${isWarning ? 'text-destructive animate-pulse' : 'text-primary'}`}>
      {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
      <Clock className="w-3.5 h-3.5" />
      {elapsed}
    </div>
  );
}

export default function LaboratoryDashboard() {
  const { profile, user, loading: authLoading } = useAuth();
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
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
  const { data: activeSessions } = useCollection(activeSessionsQuery);

  const usageQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "lab_usage");
  }, [firestore]);
  const { data: allHistory } = useCollection(usageQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users");
  }, [firestore]);
  const { data: allUsers } = useCollection(usersQuery);

  const stats = useMemo(() => {
    return {
      active: activeSessions?.length || 0,
      totalHistory: allHistory?.length || 0,
      totalFaculty: allUsers?.length || 0,
    };
  }, [activeSessions, allHistory, allUsers]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await signOut(auth);
        window.location.href = '/'; 
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleStopSession = useCallback(async (session: any, isAuto = false) => {
    if (!firestore || isStopping === session.id) return;
    setIsStopping(session.id);
    
    try {
      const start = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const durationStr = isAuto ? "3h 0m (Auto-Closed)" : `${diffHrs}h ${diffMins}m`;

      if (session.logId) {
        const logRef = doc(firestore, "lab_usage", session.logId);
        await updateDoc(logRef, {
          endTime: now.toISOString(),
          durationMinutes: Math.min(Math.floor(diffMs / 60000), 180),
          totalDuration: durationStr,
          status: "Completed",
          isAutoClosed: isAuto
        });
      }

      await deleteDoc(doc(firestore, "active_sessions", session.id));

      toast({
        title: isAuto ? "Session Auto-Closed" : "Session Ended",
        description: isAuto 
          ? `Laboratory ${session.roomId} reached the 3-hour hard limit.`
          : `Laboratory ${session.roomId} is now available for the next faculty member.`,
        variant: isAuto ? "destructive" : "default"
      });
    } catch (error: any) {
      console.error("Stop session error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not sync session status to institutional records."
      });
    } finally {
      setIsStopping(null);
    }
  }, [firestore, isStopping, toast]);

  const handleCompleteSetup = async () => {
    if (!selectedProgram || !user || !firestore) return;
    setIsUpdatingProfile(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        collegeOffice: selectedProgram,
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
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col w-full max-w-none">
      {!profile.isSetupComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-lg shadow-2xl border-none overflow-visible">
            <CardHeader className="space-y-1 pb-8 border-b bg-accent/30 rounded-t-xl">
              <CardTitle className="text-2xl font-bold text-primary">Welcome, {profile.fullName}!</CardTitle>
              <CardDescription>Select your CICS Degree Program to continue.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6 overflow-visible">
              <div className="space-y-4">
                <Label className="font-bold text-slate-700">CICS Program</Label>
                <Select onValueChange={setSelectedProgram} value={selectedProgram}>
                  <SelectTrigger className="w-full py-8 text-lg border-2">
                    <SelectValue placeholder="Choose program..." />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {CICS_PROGRAMS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCompleteSetup} 
                className="w-full py-8 text-xl font-black bg-primary"
                disabled={isUpdatingProfile || !selectedProgram}
              >
                {isUpdatingProfile ? "Saving..." : "Complete Setup"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="bg-primary text-white py-5 shadow-xl sticky top-0 z-50">
        <div className="w-full px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-xl">
              <Database className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none uppercase">CICS LAB COMMAND</h1>
              <p className="text-[10px] font-black text-cyan-400 mt-1 uppercase tracking-widest">Informatics & Computing Studies</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">CICS Systems Online</span>
             </div>
             <Button 
                onClick={handleLogout} 
                style={{ cursor: 'pointer' }}
                className="bg-white text-primary hover:bg-red-50 hover:text-red-600 transition-colors font-bold flex items-center gap-2 px-4 h-10 rounded-md shadow-sm"
             >
               <LogOut className="w-4 h-4" />
               <span className="text-sm">Sign Out</span>
             </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 md:px-12 py-10 flex-1 flex flex-col space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-md bg-white border-l-4 border-blue-600">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">CICS Total Usage</p>
                <p className="text-3xl font-black text-slate-900">{stats.totalHistory}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><History className="w-6 h-6" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white border-l-4 border-green-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Enrolled Faculty</p>
                <p className="text-3xl font-black text-slate-900">{stats.totalFaculty}</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Users className="w-6 h-6" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white border-l-4 border-cyan-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Sessions</p>
                <p className="text-3xl font-black text-slate-900">{stats.active}</p>
              </div>
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><Activity className="w-6 h-6" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-[#0F172A] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-cyan-400">
                <UserCircle2 className="w-7 h-7" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate">{profile.fullName}</p>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter text-cyan-400 border-cyan-400/30 px-1.5 h-4 mt-1">
                  {isAdmin ? "System Administrator" : profile.collegeOffice || "CICS Member"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Database className="w-8 h-8 text-primary" />
                 CICS Lab Availability Map
               </h2>
               <div className="bg-white px-4 py-2 rounded-xl shadow-sm border text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Real-Time Synchronization
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {LAB_ROOMS.map((roomName) => {
                const session = activeSessions?.find(s => s.roomId === roomName);
                const isOccupied = !!session;
                const isMySession = session?.userId === user?.uid;

                return (
                  <Card key={roomName} className={`bg-white border-none shadow-lg transition-all duration-300 relative group ${isOccupied ? 'ring-2 ring-destructive/20' : 'hover:scale-[1.02]'}`}>
                    <div className={`h-2 w-full rounded-t-lg ${isOccupied ? 'bg-destructive' : 'bg-green-500'}`} />
                    <CardHeader className="pb-3 pt-5">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base font-black text-slate-800 truncate">{roomName}</CardTitle>
                        <div className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${isOccupied ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                          {isOccupied ? 'Occupied' : 'Available'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-6">
                      {isOccupied ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                              {session.fullName?.[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] font-black text-slate-900 truncate">{session.fullName}</p>
                              <p className="text-[9px] font-bold text-muted-foreground truncate">{session.collegeOffice}</p>
                            </div>
                          </div>
                          <div className="pt-3 border-t flex flex-col gap-3">
                            <LiveTimer 
                              startTime={session.startTime} 
                              onAutoClose={() => handleStopSession(session, true)} 
                            />
                            {(isMySession || isAdmin) && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="w-full h-8 text-[9px] font-black uppercase tracking-widest"
                                onClick={() => handleStopSession(session)}
                                disabled={isStopping === session.id}
                              >
                                {isStopping === session.id ? "Ending..." : "End Session"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center flex flex-col items-center">
                          <DoorOpen className="w-12 h-12 text-slate-100 group-hover:text-green-500/20 transition-all duration-500" />
                          <p className="text-[9px] mt-4 font-black uppercase text-slate-300 tracking-[0.2em]">Vacant</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4 pt-14">
              <Link href="/check-in/" className="block">
                <Button className="w-full h-20 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl flex items-center justify-start px-8 gap-5 group transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-black">Scan ID to Log</p>
                    <p className="text-[10px] font-bold opacity-70">Begin CICS Lab Session</p>
                  </div>
                </Button>
              </Link>

              <div className="grid grid-cols-1 gap-4">
                <Link href="/profile/" className="block">
                  <Button variant="outline" className="w-full h-16 border-none bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-sm flex items-center justify-start px-6 gap-4 group">
                    <div className="p-2 bg-blue-50 text-primary rounded-lg"><Settings className="w-5 h-5" /></div>
                    <p className="text-sm font-black">Profile Management</p>
                  </Button>
                </Link>

                {isAdmin && (
                  <>
                    <Link href="/history/" className="block">
                      <Button variant="outline" className="w-full h-16 border-none bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-sm flex items-center justify-start px-6 gap-4 group">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><History className="w-5 h-5" /></div>
                        <p className="text-sm font-black">CICS Usage Logs</p>
                      </Button>
                    </Link>
                    <Link href="/admin/" className="block">
                      <Button variant="outline" className="w-full h-16 border-none bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-sm flex items-center justify-start px-6 gap-4 group">
                        <div className="p-2 bg-destructive/5 text-destructive rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                        <p className="text-sm font-black">Admin Command</p>
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="p-8 bg-[#0F172A] rounded-3xl text-white space-y-4 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-widest relative z-10">
                  <Clock className="w-4 h-4" /> CICS POLICY
               </div>
               <p className="text-xs leading-relaxed text-slate-400 relative z-10 font-medium">
                  Laboratory sessions are strictly capped at 3 hours. Please ensure logs are finalized to maintain accurate departmental metrics.
               </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center bg-white/50 backdrop-blur-sm border-t mt-auto w-full">
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.5em]">
          CICS Command Center • Informatics and Computing Studies
        </p>
      </footer>
    </div>
  );
}
