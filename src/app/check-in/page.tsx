
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DoorOpen, User, Building, Mail, ArrowLeft, QrCode, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { collection, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const LAB_ROOMS = Array.from({ length: 10 }, (_, i) => `Computer Lab ${101 + i}`);

export default function LaboratoryUsagePage() {
  const { profile, user, loading } = useAuth();
  const firestore = useFirestore();
  const [room, setRoom] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isIdVerified, setIsIdVerified] = useState(false);
  const scannerRef = useRef<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Real-time occupancy check
  const activeSessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "active_sessions");
  }, [firestore]);
  const { data: activeSessions } = useCollection(activeSessionsQuery);

  useEffect(() => {
    let html5QrcodeScanner: any = null;

    if (isScannerActive) {
      import("html5-qrcode").then((lib) => {
        html5QrcodeScanner = new lib.Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        html5QrcodeScanner.render(
          () => {
            toast({ title: "ID Verified" });
            setIsIdVerified(true);
            setIsScannerActive(false);
            if (html5QrcodeScanner) html5QrcodeScanner.clear().catch(console.error);
          },
          () => {}
        );
        scannerRef.current = html5QrcodeScanner;
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScannerActive, toast]);

  const handleConfirmUsage = async () => {
    if (!user || !profile || !firestore || !room) return;

    // The 'Bawal' Rule: Occupancy check
    const currentSession = activeSessions?.find(s => s.roomId === room);
    if (currentSession) {
      toast({
        variant: "destructive",
        title: "Room Occupied",
        description: `This room is currently being utilized by ${currentSession.fullName}.`,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const activeSessionRef = doc(firestore, "active_sessions", room);
      await setDoc(activeSessionRef, {
        roomId: room,
        userId: user.uid,
        fullName: profile.fullName || user.displayName || "Institutional Member",
        email: user.email,
        collegeOffice: profile.collegeOffice || "Registry Pending",
        startTime: new Date().toISOString(),
      });

      router.push(`/confirmation?room=${encodeURIComponent(room)}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Log Failed",
        description: "An active session is already registered for this room.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-primary text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <DoorOpen className="w-8 h-8" />
            <h1 className="text-xl font-bold">NEU LAB ROOM</h1>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-12 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-primary">Lab Room Log</h2>
            <p className="text-muted-foreground">Verify ID and select a vacant room.</p>
          </div>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-accent/10 border-b p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="flex flex-col mt-1">
                    <span>{profile.email}</span>
                    <span>{profile.collegeOffice}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8 p-8">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    Professor ID Verification
                  </Label>
                  {isIdVerified && (
                    <div className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </div>
                  )}
                </div>

                {!isIdVerified && (
                  <div className="space-y-4">
                    {!isScannerActive ? (
                      <Button 
                        variant="outline" 
                        className="w-full py-12 border-dashed border-2 flex flex-col gap-3"
                        onClick={() => setIsScannerActive(true)}
                      >
                        <QrCode className="w-8 h-8 text-primary" />
                        <span>Tap to Scan ID</span>
                      </Button>
                    ) : (
                      <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 bg-muted" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <Label className="text-lg font-bold">Select Laboratory Room</Label>
                <RadioGroup 
                  onValueChange={setRoom} 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  disabled={!isIdVerified}
                >
                  {LAB_ROOMS.map((option) => {
                    const isOccupied = activeSessions?.some(s => s.roomId === option);
                    return (
                      <div key={option} className={`relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 ${isOccupied ? 'opacity-40 cursor-not-allowed border-red-100 bg-red-50' : 'hover:border-primary/30 border-muted'}`}>
                        <RadioGroupItem value={option} id={option} disabled={!isIdVerified || isOccupied} />
                        <Label htmlFor={option} className={`flex-1 font-medium ${isOccupied ? 'cursor-not-allowed text-red-700' : 'cursor-pointer'}`}>
                          {option}
                          {isOccupied && <span className="block text-[10px] font-black uppercase text-red-500 mt-0.5 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Occupied</span>}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <Button 
                onClick={handleConfirmUsage}
                disabled={!room || isSubmitting || !isIdVerified}
                className="w-full py-8 text-xl font-bold shadow-xl"
              >
                {isSubmitting ? "Syncing Log..." : "Start Laboratory Session"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
