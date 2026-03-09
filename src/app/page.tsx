
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LogOut, GraduationCap, User, Building, Mail, BookOpen } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const VISIT_REASONS = [
  "Reading",
  "Research",
  "Studying",
  "Use of Computer",
  "Group Study",
  "Other"
];

export default function VisitorCheckInPage() {
  const { profile, logout, loading, user } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleVisitSubmit = async () => {
    if (!reason || !user || !profile) return;

    setIsSubmitting(true);
    try {
      // Record visit in subcollection as per backend.json structure
      const visitsRef = collection(db, "users", user.uid, "visits");
      await addDoc(visitsRef, {
        userId: user.uid,
        fullName: profile.fullName,
        email: profile.email,
        collegeOffice: profile.collegeOffice,
        reason: reason,
        timestamp: serverTimestamp(),
      });

      router.push("/confirmation");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Could not record your visit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU Library</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={logout}
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-12 max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-primary">Visitor Check-In</h2>
            <p className="text-muted-foreground">Please log your visit details below.</p>
          </div>

          <Card className="shadow-lg border-none">
            <CardHeader className="bg-accent/10 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="flex flex-col gap-0.5 mt-1">
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {profile.email}</span>
                    <span className="flex items-center gap-1.5"><Building className="w-3 h-3" /> {profile.collegeOffice}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                  <BookOpen className="w-5 h-5" />
                  <Label>What is your reason for visiting today?</Label>
                </div>

                <RadioGroup 
                  onValueChange={setReason} 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {VISIT_REASONS.map((option) => (
                    <div key={option} className="flex items-center space-x-3 p-4 rounded-xl border-2 border-muted transition-all hover:bg-accent/5 hover:border-accent cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value={option} id={option} className="text-primary border-primary" />
                      <Label htmlFor={option} className="flex-1 font-medium cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button 
                onClick={handleVisitSubmit}
                disabled={!reason || isSubmitting}
                className="w-full py-8 text-xl font-bold shadow-xl transition-transform active:scale-95"
              >
                {isSubmitting ? "Recording Visit..." : "Submit Visit Entry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
