
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, FlaskConical } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "Laboratory Room";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-primary">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-20 h-20 bg-green-100 flex items-center justify-center rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Session Logged!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pb-10">
          <div className="p-4 bg-accent/20 rounded-xl border border-accent/30 space-y-2">
             <FlaskConical className="w-8 h-8 text-primary mx-auto" />
             <p className="font-bold text-lg text-primary">Thank you for using {room}</p>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            Your laboratory usage session has been recorded in the institutional database.
          </p>

          <Button 
            onClick={() => router.push("/dashboard")} 
            className="w-full py-6 text-lg font-semibold shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
