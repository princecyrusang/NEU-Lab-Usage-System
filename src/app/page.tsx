"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Building, Mail, ShieldCheck, GraduationCap } from "lucide-react";

export default function Home() {
  const { profile, logout, loading } = useAuth();

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
      {/* Institutional Header */}
      <header className="bg-primary text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">NEU Portal Access</h1>
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

      <main className="container mx-auto px-4 pt-12 max-w-4xl">
        <div className="grid gap-8">
          {/* Welcome Section */}
          <section className="space-y-2">
            <h2 className="text-3xl font-bold text-primary">Academic Dashboard</h2>
            <p className="text-muted-foreground">Welcome back to the institutional portal.</p>
          </section>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <Card className="md:col-span-2 shadow-md border-none overflow-hidden">
              <CardHeader className="bg-accent/20 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-white">{profile.role.toUpperCase()}</Badge>
                      {profile.isSetupComplete && (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Verified Institutional Account
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <User className="w-8 h-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email Address
                    </p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-3 h-3" /> Affiliation
                    </p>
                    <p className="font-medium">{profile.college_office}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-bold text-primary mb-2">Account Status</h3>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Google Authentication Linked
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Institutional Domain Verified
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Profile Configuration Complete
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start py-6 hover:bg-accent/20 border-accent/50 text-primary">
                  <User className="w-4 h-4 mr-3" /> Update Profile
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 hover:bg-accent/20 border-accent/50 text-primary">
                  <ShieldCheck className="w-4 h-4 mr-3" /> Security Settings
                </Button>
                <Button variant="outline" className="w-full justify-start py-6 hover:bg-accent/20 border-accent/50 text-primary">
                  <Building className="w-4 h-4 mr-3" /> Office Directory
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
