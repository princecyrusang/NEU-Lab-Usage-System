
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlaskConical, User, Building, Mail, ArrowLeft, QrCode, CheckCircle2 } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

const LAB_ROOMS = [
  "Laboratory Room 101",
  "Laboratory Room 102",
  "Computer Lab 201",
  "Computer Lab 202",
  "Physics Lab 301",
  "Chemistry Lab 302",
  "Biology Lab 303",
  "Multimedia Room 401"
];

export default function LaboratoryUsagePage() {
  const { profile, user, loading } = useAuth();
  const firestore = useFirestore();
  const [room, setRoom] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isIdVerified, setIsIdVerified] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isScannerActive && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          toast({
            title: "ID Verified",
            description: `Professor ID successfully identified: ${decodedText.substring(0, 8)}...`,
          });
          setIsIdVerified(true);
          setIsScannerActive(false);
          if (scannerRef.current) {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        },
        () => {
          // Scanning...
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScannerActive, toast]);

  const handleUsageSubmit = () => {
    if (!room || !user || !profile || !firestore || !isIdVerified) {
      if (!isIdVerified) {
        toast({
          variant: "destructive",
          title: "ID Required",
          description: "Please scan your professor ID to verify usage.",
        });
      }
      return;
    }

    setIsSubmitting(true);
    
    // Explicitly define the data object as requested for debugging
    const usageData = {
      userId: user.uid,
      fullName: profile.fullName || user.displayName || "Unknown Professor",
      email: user.email,
      collegeOffice: profile.collegeOffice || "Unassigned Office",
      roomNumber: room,
      timestamp: new Date(),
    };

    const usageRef = collection(firestore, "lab_usage");
    
    addDoc(usageRef, usageData)
      .then(() => {
        router.push(`/confirmation?room=${encodeURIComponent(room)}`);
      })
      .catch((error) => {
        // Removed custom FirestorePermissionError wrapper to see raw error
        console.error("Firestore Save Error:", error);
        
        toast({
          variant: "destructive",
          title: "Submission Error",
          description: error.message || "Could not record laboratory usage. Please check institutional access.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-primary text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            < FlaskConical className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU Laboratory</h1>
          </Link>
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-12 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-primary">Lab Room Log</h2>
            <p className="text-muted-foreground">Scan ID and select the room you are utilizing.</p>
          </div>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-accent/10 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="flex flex-col gap-0.5 mt-1">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {profile.collegeOffice}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    Professor ID Verification
                  </Label>
                  {isIdVerified && (
                    <div className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>

                {!isIdVerified && (
                  <div className="space-y-4">
                    {!isScannerActive ? (
                      <Button 
                        variant="outline" 
                        className="w-full py-12 border-dashed border-2 flex flex-col gap-3 hover:bg-accent/10"
                        onClick={() => setIsScannerActive(true)}
                      >
                        <QrCode className="w-8 h-8 text-primary" />
                        <span>Click to Start Scanner</span>
                      </Button>
                    ) : (
                      <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-primary/20 shadow-inner bg-muted" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                  <FlaskConical className="w-5 h-5" />
                  <Label>Which room are you using today?</Label>
                </div>

                <RadioGroup 
                  onValueChange={setRoom} 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  disabled={!isIdVerified}
                >
                  {LAB_ROOMS.map((option) => (
                    <div key={option} className={`flex items-center space-x-3 p-4 rounded-xl border-2 border-muted transition-all cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 ${!isIdVerified ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/5 hover:border-accent'}`}>
                      <RadioGroupItem value={option} id={option} className="text-primary border-primary" disabled={!isIdVerified} />
                      <Label htmlFor={option} className={`flex-1 font-medium ${!isIdVerified ? 'cursor-not-allowed' : 'cursor-pointer'}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button 
                onClick={handleUsageSubmit}
                disabled={!room || isSubmitting || !isIdVerified}
                className="w-full py-8 text-xl font-bold shadow-xl transition-transform active:scale-95"
              >
                {isSubmitting ? "Logging Usage..." : "Confirm Usage Log"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
