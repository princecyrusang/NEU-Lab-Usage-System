
"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, ShieldCheck, QrCode, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function LoginPage() {
  const { login, loading, user } = useAuth();

  // Redirect if user is already detected
  useEffect(() => {
    if (user) {
      window.location.href = "/dashboard/";
    }
  }, [user]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0C46A3]">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-20 h-20 bg-primary flex items-center justify-center rounded-2xl shadow-lg">
            <DoorOpen className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">NEU LAB ROOM</CardTitle>
            <CardDescription className="text-base">Institutional Faculty Usage Log</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-10">
          <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-lg text-sm text-primary font-medium border border-accent">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p>Access restricted to verified faculty (@neu.edu.ph) only. QR scanner enabled after login.</p>
          </div>
          
          <Button 
            onClick={login} 
            disabled={loading}
            className="w-full py-6 text-lg font-semibold shadow-md transition-all hover:scale-[1.01]"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                Processing Login...
              </span>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with @neu.edu.ph
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or using ID</span>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center gap-2 text-muted-foreground text-sm">
             <QrCode className="w-4 h-4" />
             <span>ID Scanning available for registered kiosks</span>
          </div>
          
          <p className="text-center text-xs text-muted-foreground pt-4">
            Authorized access only. Data collection is governed by NEU Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
