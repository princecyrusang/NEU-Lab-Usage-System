"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, ArrowRight, School } from "lucide-react";
import { useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useAuth as useFirebaseAuth } from "@/firebase";

export default function LoginPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Redirection is now handled by AuthContext, but we keep this as a local UI safeguard
  useEffect(() => {
    if (user && profile && !authLoading) {
      setIsRedirecting(true);
      window.location.replace("/dashboard/");
    }
  }, [user, profile, authLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) setShowManualEntry(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleLogin = async () => {
    if (!firebaseAuth) return;
    setIsRedirecting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 
        prompt: "select_account",
        hd: "neu.edu.ph" 
      });
      
      await signInWithPopup(firebaseAuth, provider);
      // Let AuthContext handle the final redirect to ensure profile hydration
    } catch (error: any) {
      console.error("Login Error:", error);
      setIsRedirecting(false);
      alert("Login failed: " + (error.message || "Please check your institutional account and try again."));
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
          <p className="text-white font-medium">Entering NEU LAB SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-primary">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-24 h-24 bg-primary/10 flex items-center justify-center rounded-2xl shadow-inner">
            <School className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">NEU LAB SYSTEM</CardTitle>
            <CardDescription className="text-base font-bold text-muted-foreground uppercase tracking-widest">
              INSTITUTIONAL LOG SYSTEM
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-10">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-sm text-primary font-medium border border-blue-100">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p>Institutional access only (@neu.edu.ph). Log data is recorded for university reports.</p>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full py-8 text-xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-95 bg-primary hover:bg-primary/90"
          >
            Sign in with Google
          </Button>

          {showManualEntry && (
            <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-700">
              <Button 
                variant="outline" 
                className="w-full py-6 text-muted-foreground border-dashed"
                onClick={() => window.location.href = "/dashboard/"}
              >
                Accessing Dashboard...
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          <div className="relative pt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-bold">New Era University</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
