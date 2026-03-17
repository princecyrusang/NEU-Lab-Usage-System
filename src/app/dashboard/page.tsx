
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
  DoorOpen,
  User
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
  "Multimedia Room 106",
  "Research Hub 201",
  "Tech Suite 202"
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
        timestamp: now.toISOString()
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
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col relative">
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
        <div className="w-full px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚪</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NEU LAB ROOM</h1>
              <p className="text-[10px] uppercase font-black text-blue-200 mt-1">Institutional Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right mr-2">
                <p className="text-sm font-bold leading-none">{profile.fullName}</p>
                <p className="text-[10px] uppercase font-black text-blue-200 mt-1">{isAdmin ? "System Administrator" : "Professor"}</p>
             </div>
             <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10 font-bold px-3">
               <LogOut className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 md:px-12 py-8 flex-1 flex flex-col space-y-8">
        
        {/* Top Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-md shadow-lg border-none border-l-4 border-blue-600">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl text-primary"><DoorClosed className="w-10 h-10" /></div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Sessions</p>
                <p className="text-4xl font-black text-slate-900">{stats.totalActive}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-md shadow-lg border-none border-l-4 border-green-500">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-green-50 rounded-2xl text-green-600"><DoorOpen className="w-10 h-10" /></div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Facilities</p>
                <p className="text-4xl font-black text-slate-900">{stats.availableRooms}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0F172A] text-white shadow-2xl border-none">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl"><Users className="w-10 h-10 text-cyan-400" /></div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Status</p>
                <p className="text-2xl font-black text-cyan-400">Institutional Sync Live</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
          
          {/* Laboratory Availability Map (3/4 Width) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Database className="w-7 h-7 text-primary" />
                 Laboratory Availability Map
               </h2>
               <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-[10px] font-black uppercase text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Real-Time Updates Active
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {LAB_ROOMS.map((roomName) => {
                const session = activeSessions?.find(s => s.roomId === roomName);
                const isOccupied = !!session;
                const isMySession = session?.userId === user?.uid;

                return (
                  <Card key={roomName} className={`bg-white/80 backdrop-blur-md border-none shadow-lg transition-all duration-300 group ${isOccupied ? 'ring-2 ring-destructive/20' : 'hover:scale-[1.02] hover:shadow-2xl'}`}>
                    <div className={`h-2 w-full ${isOccupied ? 'bg-destructive' : 'bg-green-500'}`} />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-black text-slate-800">{roomName}</CardTitle>
                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${isOccupied ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                          {isOccupied ? 'Occupied' : 'Available'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isOccupied ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xs font-black text-primary">
                              {session.fullName?.[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-black text-slate-900 truncate">{session.fullName}</p>
                              <p className="text-[10px] font-bold text-muted-foreground truncate">{session.collegeOffice}</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t flex justify-between items-center">
                            <LiveTimer startTime={session.startTime} />
                            {isMySession && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 text-[9px] font-black uppercase tracking-widest px-3"
                                onClick={() => handleStopSession(session)}
                                disabled={isStopping === session.id}
                              >
                                {isStopping === session.id ? "Stopping..." : "End Session"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <DoorOpen className="w-14 h-14 mx-auto text-slate-200 group-hover:text-green-500 transition-colors duration-500" />
                          <p className="text-[10px] mt-4 font-black uppercase text-slate-300 tracking-widest">Ready for Use</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & Navigation Sidebar (1/4 Width) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Identity Card */}
            <Card className="bg-white/80 backdrop-blur-md border-none shadow-lg overflow-hidden">
               <div className="h-1.5 w-full bg-primary" />
               <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <User className="w-8 h-8" />
                     </div>
                     <div>
                        <p className="text-lg font-black text-slate-900 truncate">{profile.fullName}</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{isAdmin ? "System Administrator" : "Professor"}</p>
                     </div>
                  </div>
                  <div className="pt-6 border-t space-y-3">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold">University Email</span>
                        <span className="font-black text-slate-700 truncate max-w-[150px]">{profile.email}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold">Affiliation</span>
                        <span className="font-black text-slate-700 truncate max-w-[150px]">{profile.collegeOffice || "Registry Pending"}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="space-y-4">
              <Link href="/check-in/" className="block">
                <Button className="w-full h-20 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl flex items-center justify-start px-8 gap-5 group transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-black">Log Lab Usage</p>
                    <p className="text-[10px] font-bold opacity-70">Start new room session</p>
                  </div>
                </Button>
              </Link>

              <Link href="/profile/" className="block">
                <Button variant="outline" className="w-full h-16 border-none bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-md flex items-center justify-start px-6 gap-4 group transition-all">
                  <div className="p-2 bg-blue-50 text-primary rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">Faculty Profile</p>
                    <p className="text-[9px] font-bold text-muted-foreground">Manage identity</p>
                  </div>
                </Button>
              </Link>

              {isAdmin && (
                <>
                  <Link href="/history/" className="block">
                    <Button variant="outline" className="w-full h-16 border-none bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-md flex items-center justify-start px-6 gap-4 group transition-all">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <History className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black">Usage History</p>
                        <p className="text-[9px] font-bold text-muted-foreground">View institutional logs</p>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/admin/" className="block">
                    <Button variant="outline" className="w-full h-16 border-none bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-md flex items-center justify-start px-6 gap-4 group transition-all">
                      <div className="p-2 bg-destructive/5 text-destructive rounded-lg group-hover:bg-destructive/10 transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black">Admin Center</p>
                        <p className="text-[9px] font-bold text-muted-foreground">Manage system telemetry</p>
                      </div>
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Institutional Footnote */}
            <div className="p-8 bg-[#0F172A] rounded-3xl text-white space-y-4 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-widest relative z-10">
                  <Clock className="w-4 h-4" /> System Telemetry
               </div>
               <p className="text-sm leading-relaxed text-slate-400 relative z-10 font-medium">
                  Laboratory occupancy is tracked in real-time. Unauthorized sessions exceeding 3 hours will be flagged for review.
               </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center bg-white/50 backdrop-blur-sm border-t">
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em]">
          New Era University • Real-Time Information Systems Division
        </p>
      </footer>
    </div>
  );
}
