
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signOut, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  getRedirectResult, 
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
  login: () => Promise<void>;
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
          email: firebaseUser.email || "",
          fullName: firebaseUser.displayName || "",
          role: "Professor",
          collegeOffice: "",
          isSetupComplete: false,
          isBlocked: false,
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error("Profile sync error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!firebaseAuth) return;

    // Process redirect result immediately on mount
    getRedirectResult(firebaseAuth).catch(err => {
      console.error("Redirect handler error:", err);
    });

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase() || "";
        if (!email.endsWith("@neu.edu.ph")) {
          await signOut(firebaseAuth);
          setUser(null);
          setProfile(null);
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: "Only verified @neu.edu.ph institutional accounts are allowed.",
          });
          setLoading(false);
          return;
        }
        setUser(firebaseUser);
        await syncProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseAuth, toast]);

  // Client-Side Only Redirection Logic for Static Export stability
  useEffect(() => {
    if (loading) return;

    const cleanPath = pathname?.replace(/\/$/, '') || "";
    const isLoginPage = cleanPath === "/login" || cleanPath === "";

    if (user && profile) {
      if (profile.isBlocked && cleanPath !== "/access-denied") {
        window.location.href = "/access-denied/";
      } else if (!profile.isSetupComplete && cleanPath !== "/onboarding" && cleanPath !== "/access-denied") {
        window.location.href = "/onboarding/";
      } else if (profile.isSetupComplete && isLoginPage) {
        window.location.href = "/dashboard/";
      }
    } else if (!user && !isLoginPage && cleanPath !== "/access-denied") {
      window.location.href = "/login/";
    }
  }, [user, profile, loading, pathname]);

  const login = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(firebaseAuth, googleProvider);
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "Failed to initiate login.",
      });
    }
  };

  const logout = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    await signOut(firebaseAuth);
    window.location.href = "/login/";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
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
