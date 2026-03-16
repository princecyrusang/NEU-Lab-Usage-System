"use client";

import { useAuth } from "@/context/auth-context";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DoorOpen, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Building,
  User as UserIcon,
  SearchX,
  Loader2,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { AdminPageHeader } from "@/components/AdminPageHeader";

export default function LaboratoryHistoryPage() {
  const { profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const isAdmin = profile?.role === "Admin";

  const usageQuery = useMemoFirebase(() => {
    if (!isAdmin || authLoading || !firestore) return null;
    return query(collection(firestore, "lab_usage"), orderBy("timestamp", "desc"));
  }, [isAdmin, firestore, authLoading]);

  const { data: usageLogs, isLoading: usageLoading, error } = useCollection(usageQuery);

  const isLoading = authLoading || (isAdmin && usageLoading);

  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#EEF1F6]">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-destructive/10 flex items-center justify-center rounded-full">
              <ShieldAlert className="w-12 h-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-destructive">Restricted Access</h3>
              <p className="text-muted-foreground">
                Institutional usage logs are only accessible to system administrators.
              </p>
            </div>
            <Link href="/dashboard" className="block">
              <Button className="w-full py-6">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1F6]">
      <header className="bg-[#0C46A3] text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <DoorOpen className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU LAB ROOM</h1>
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <AdminPageHeader 
            title="Institutional Usage Logs" 
            description="Monitoring faculty utilization of NEU LAB ROOM facilities across the university." 
            showBackButton={false}
            centered={true}
          />

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Retrieving institutional records...</p>
              </div>
            ) : error ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="py-10 text-center">
                  <p className="text-destructive font-bold text-lg">Unable to load institutional history</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {error.message || "An error occurred while fetching usage logs."}
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : !usageLogs || usageLogs.length === 0 ? (
              <Card className="border-dashed border-2 bg-white/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <SearchX className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">No records found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      There are currently no recorded room sessions in the institutional database.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {usageLogs.map((log) => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  const isValidDate = !isNaN(logDate.getTime());

                  return (
                    <Card key={log.id} className="hover:shadow-lg transition-all border-none shadow-sm overflow-hidden group">
                      <div className="h-1 bg-[#47C1EB] w-0 group-hover:w-full transition-all duration-300" />
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="w-14 h-14 bg-accent/30 rounded-2xl flex items-center justify-center text-[#0C46A3] shrink-0 shadow-inner">
                            <DoorOpen className="w-7 h-7" />
                          </div>
                          
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h4 className="font-bold text-xl text-[#0C46A3] truncate">
                                {log.roomNumber || "Room Session"}
                              </h4>
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {isValidDate ? format(logDate, 'PPP') : ''}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4 text-[#47C1EB]" />
                                {isValidDate ? format(logDate, 'p') : ''}
                              </span>
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Building className="w-4 h-4 text-[#47C1EB]" />
                                {log.collegeOffice || "N/A"}
                              </span>
                              <span className="flex items-center gap-2 text-[#0C46A3] font-semibold">
                                <UserIcon className="w-4 h-4" />
                                {log.fullName || "Institutional Member"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}