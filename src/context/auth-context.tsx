
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "Admin" | "Professor";
  collegeOffice: string;
  isSetupComplete: boolean;
  isBlocked: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseAuth = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { toast } = useToast();

  const syncProfile = async (firebaseUser: User) => {
    if (!firestore) return null;
    try {
      const docRef = doc(firestore, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        return data;
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email?.toLowerCase() || "",
          fullName: firebaseUser.displayName || "Institutional Member",
          role: "Professor",
          collegeOffice: "", // Leave empty for onboarding modal
          isSetupComplete: false,
          isBlocked: false,
        };
        
        await setDoc(docRef, newProfile, { merge: true });
        setProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error("Critical Profile Sync Error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!firebaseAuth) return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase() || "";
        if (!email.endsWith("@neu.edu.ph")) {
          await signOut(firebaseAuth);
          setUser(null);
          setProfile(null);
          toast({
            variant: "destructive",
            title: "Institutional Only",
            description: "Please sign in with your @neu.edu.ph account.",
          });
          setLoading(false);
          return;
        }
        
        await syncProfile(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseAuth, firestore, toast]);

  useEffect(() => {
    if (loading) return;

    const cleanPath = pathname?.replace(/\/$/, '') || "";
    const isLoginPage = cleanPath === "/login" || cleanPath === "" || cleanPath === "/index.html";

    if (user && profile) {
      if (profile.isBlocked && cleanPath !== "/access-denied") {
        window.location.href = "/access-denied/";
      } else if (isLoginPage) {
        // Redirection to dashboard is handled; onboarding is now a modal inside dashboard
        window.location.href = "/dashboard/";
      }
    } else if (!user && !isLoginPage && cleanPath !== "/access-denied") {
      window.location.href = "/login/";
    }
  }, [user, profile, loading, pathname]);

  const logout = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    await signOut(firebaseAuth);
    window.location.href = "/login/";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
