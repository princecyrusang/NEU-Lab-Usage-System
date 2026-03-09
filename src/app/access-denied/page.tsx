
"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, LogOut, PhoneCall } from "lucide-react";

export default function AccessDeniedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0C46A3]">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-20 h-20 bg-destructive/10 flex items-center justify-center rounded-full">
            <ShieldAlert className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pb-10">
          <p className="text-muted-foreground text-lg leading-relaxed">
            You are not allowed to enter the library. Your institutional access has been restricted.
          </p>
          
          <div className="p-4 bg-muted rounded-lg flex items-center gap-3 text-sm font-medium">
            <PhoneCall className="w-5 h-5 text-primary" />
            <span>Please contact the library staff or security for assistance.</span>
          </div>

          <Button 
            onClick={logout} 
            variant="outline"
            className="w-full py-6 text-lg font-semibold"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
