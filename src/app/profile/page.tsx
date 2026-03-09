
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowLeft, UserCircle2, Building2, Save } from "lucide-react";
import Link from "next/link";

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

export default function ProfileSettingsPage() {
  const { profile, user, loading } = useAuth();
  const firestore = useFirestore();
  const [fullName, setFullName] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setSelectedOffice(profile.collegeOffice || "");
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!fullName || !selectedOffice || !user || !firestore) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill in all fields to proceed.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        fullName: fullName,
        collegeOffice: selectedOffice,
      });
      toast({
        title: "Profile Updated",
        description: "Your details have been successfully updated.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile.",
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
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU Library</h1>
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

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">Profile Settings</h2>
            <p className="text-muted-foreground">Manage your university affiliation and personal details.</p>
          </div>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-accent/10 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <UserCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Institutional Identity</CardTitle>
                  <CardDescription>Verified @neu.edu.ph account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                  <Input 
                    id="email" 
                    value={profile.email} 
                    disabled 
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Institutional email cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    Full Name
                  </Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="py-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    College or Office
                  </Label>
                  <Select onValueChange={setSelectedOffice} value={selectedOffice}>
                    <SelectTrigger id="office" className="w-full py-6">
                      <SelectValue placeholder="Select your affiliation..." />
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

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSubmit} 
                  className="w-full py-6 text-lg font-bold shadow-lg"
                  disabled={isSubmitting || !fullName || !selectedOffice}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Saving Changes..." : "Save Profile Details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
