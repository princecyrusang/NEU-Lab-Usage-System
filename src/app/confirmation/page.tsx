
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ConfirmationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-primary">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-20 h-20 bg-green-100 flex items-center justify-center rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Welcome to NEU Library!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pb-10">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your visit has been successfully recorded. You may now proceed inside.
          </p>

          <Button 
            onClick={() => router.push("/")} 
            className="w-full py-6 text-lg font-semibold shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Finish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
