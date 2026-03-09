
"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, Calendar, Clock, BookOpen, Building } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function VisitHistoryPage() {
  const { profile, user, loading } = useAuth();
  const firestore = useFirestore();

  // Create a conditional query based on the user's role
  const visitsQuery = useMemoFirebase(() => {
    if (!user || !profile || !firestore) return null;

    const visitsRef = collection(firestore, "visits");

    // Admins see all visits
    if (profile.role === "admin") {
      return query(visitsRef, orderBy("timestamp", "desc"));
    }

    // Regular users see only their own visits (required by security rules)
    return query(
      visitsRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
  }, [user, profile, firestore]);

  const { data: visits, isLoading: visitsLoading } = useCollection(visitsQuery);

  if (loading || visitsLoading) {
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
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU Library</h1>
          </Link>
          <Link href="/">
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

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">
              {profile?.role === "admin" ? "Global Visit Log" : "Visit History"}
            </h2>
            <p className="text-muted-foreground">
              {profile?.role === "admin" 
                ? "A comprehensive record of all library entries." 
                : "A record of your past library entries."}
            </p>
          </div>

          <div className="space-y-4">
            {!visits || visits.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">No visits found</h3>
                    <p className="text-sm text-muted-foreground">No records match the current view.</p>
                  </div>
                  {profile?.role !== "admin" && (
                    <Link href="/check-in">
                      <Button>Log Your First Visit</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              visits.map((visit) => (
                <Card key={visit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/30 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg truncate">{visit.reason}</h4>
                        {profile?.role === "admin" && (
                          <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {visit.fullName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {visit.timestamp ? format(visit.timestamp.toDate(), 'PPP') : 'Processing...'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {visit.timestamp ? format(visit.timestamp.toDate(), 'p') : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5" />
                          {visit.collegeOffice}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
