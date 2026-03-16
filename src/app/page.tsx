
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

/**
 * Root Entry Page
 * 
 * Handles initial app redirection based on authentication state.
 * Uses direct window.location for static hosting compatibility.
 */
export default function RootPage() {
  const { profile, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;

    if (profile) {
      if (!profile.isSetupComplete) {
        window.location.href = "/onboarding/";
      } else {
        window.location.href = "/dashboard/";
      }
    } else {
      window.location.href = "/login/";
    }
  }, [profile, loading, isMounted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing NEU LAB ROOM...</p>
      </div>
    </div>
  );
}
