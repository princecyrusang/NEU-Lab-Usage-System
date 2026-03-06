"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserCircle2 } from "lucide-react";

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

export default function OnboardingPage() {
  const { profile, user } = useAuth();
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedOffice || !user) {
      toast({
        variant: "destructive",
        title: "Incomplete Selection",
        description: "Please select your College or Office to proceed.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        college_office: selectedOffice,
        isSetupComplete: true,
      });
      toast({
        title: "Profile Updated",
        description: "Your account setup is now complete.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg shadow-xl border-none">
        <CardHeader className="space-y-1 pb-8 border-b bg-accent/30 rounded-t-xl">
          <div className="flex items-center gap-2 text-primary mb-2">
            <UserCircle2 className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Profile Setup</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome, {profile.fullName}!</CardTitle>
          <CardDescription>
            To complete your registration, please identify your primary affiliation within the university.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Institutional Email</Label>
              <div className="p-3 bg-muted rounded-md text-sm font-medium border border-border">
                {profile.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Select your College or Office
              </Label>
              <Select onValueChange={setSelectedOffice} value={selectedOffice}>
                <SelectTrigger id="office" className="w-full py-6">
                  <SelectValue placeholder="Select from the list..." />
                </SelectTrigger>
                <SelectContent>
                  {COLLEGES_AND_OFFICES.map((office) => (
                    <SelectItem key={office} value={office}>
                      {office}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full py-6 text-lg font-bold shadow-lg"
            disabled={isSubmitting || !selectedOffice}
          >
            {isSubmitting ? "Finalizing..." : "Complete Setup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
