
"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Building,
  User as UserIcon,
  SearchX,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

/**
 * VisitHistoryPage Component
 * 
 * Displays the history of library visits for the authenticated user.
 * Administrators see a global log of all visits across the institution.
 */
export default function VisitHistoryPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Construct the appropriate query based on user role.
  // This memoized query strictly follows Firestore Security Rules to prevent permission denials.
  const visitsQuery = useMemoFirebase(() => {
    // Only proceed if auth and profile data are fully loaded and available.
    if (!user || !profile || !firestore) return null;

    const visitsRef = collection(firestore, "visits");

    // Case 1: Administrators can list all visits.
    if (profile.role === "admin") {
      return query(visitsRef, orderBy("timestamp", "desc"));
    }

    // Case 2: Regular users can only list their own visits.
    // SECURITY CRITICAL: The Firestore security rule (resource.data.userId == request.auth.uid)
    // requires this exact filter for non-admins to avoid a "Missing or insufficient permissions" error.
    return query(
      visitsRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
  }, [user?.uid, profile?.role, firestore]);

  const { data: visits, isLoading: visitsLoading, error } = useCollection(visitsQuery);

  const isLoading = authLoading || visitsLoading;

  return (
    <div className="min-h-screen bg-[#EEF1F6]">
      <header className="bg-[#0C46A3] text-white py-4 shadow-lg sticky top-0 z-50">
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
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[#0C46A3]">
                {profile?.role === "admin" ? "Institutional Visit Logs" : "My Visit History"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {profile?.role === "admin" 
                  ? "Monitoring library access and usage patterns across the university." 
                  : "Reviewing your historical library attendance records."}
              </p>
            </div>
            {profile?.role === "admin" && (
              <Badge variant="secondary" className="w-fit bg-blue-100 text-[#0C46A3] border-blue-200 px-3 py-1 text-sm">
                Administrator View
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Retrieving visit records...</p>
              </div>
            ) : error ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="py-10 text-center">
                  <p className="text-destructive font-bold text-lg">Unable to load history</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {error.message || "Please ensure you have permission to view this content."}
                  </p>
                  <Link href="/">
                    <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : !visits || visits.length === 0 ? (
              <Card className="border-dashed border-2 bg-white/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <SearchX className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">No records found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      There are currently no recorded visits associated with this account.
                    </p>
                  </div>
                  {profile?.role !== "admin" && (
                    <Link href="/check-in">
                      <Button className="mt-4 shadow-md bg-[#0C46A3]">Record Your First Visit</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {visits.map((visit) => (
                  <Card key={visit.id} className="hover:shadow-lg transition-all border-none shadow-sm overflow-hidden group">
                    <div className="h-1 bg-[#47C1EB] w-0 group-hover:w-full transition-all duration-300" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-14 h-14 bg-accent/30 rounded-2xl flex items-center justify-center text-[#0C46A3] shrink-0 shadow-inner">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="font-bold text-xl text-[#0C46A3] truncate">
                              {visit.reason}
                            </h4>
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {visit.timestamp?.toDate ? format(visit.timestamp.toDate(), 'PPP') : 'Processing...'}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4 text-[#47C1EB]" />
                              {visit.timestamp?.toDate ? format(visit.timestamp.toDate(), 'p') : ''}
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Building className="w-4 h-4 text-[#47C1EB]" />
                              {visit.collegeOffice}
                            </span>
                            {profile?.role === "admin" && (
                              <span className="flex items-center gap-2 text-[#0C46A3] font-semibold">
                                <UserIcon className="w-4 h-4" />
                                {visit.fullName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="py-10 border-t mt-12 bg-white/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            New Era University • Library Services • Access History
          </p>
        </div>
      </footer>
    </div>
  );
}
