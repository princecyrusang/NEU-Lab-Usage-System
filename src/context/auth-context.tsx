"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signOut, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
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

    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (result?.user) {
          // Redirect result handled, auth state listener will take over
        }
      } catch (error: any) {
        console.error("Redirect error:", error);
      }
    };

    handleRedirect();

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
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
          router.push("/login");
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
  }, [firebaseAuth, toast, router]);

  useEffect(() => {
    if (loading) return;

    const cleanPath = pathname?.replace(/\/$/, '') || "";
    
    if (user && profile) {
      if (profile.isBlocked && cleanPath !== "/access-denied") {
        router.push("/access-denied");
      } else if (!profile.isSetupComplete && cleanPath !== "/onboarding" && cleanPath !== "/access-denied") {
        router.push("/onboarding");
      } else if (profile.isSetupComplete) {
        if (cleanPath === "/login" || cleanPath === "" || cleanPath === "/onboarding") {
          router.push("/dashboard");
        }
      }
    } else if (!user && !loading) {
      const publicPaths = ["/login", "", "/access-denied"];
      if (!publicPaths.includes(cleanPath) && !cleanPath.includes("/admin")) {
        router.push("/login");
      }
    }
  }, [user, profile, loading, pathname, router]);

  const login = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(firebaseAuth, googleProvider);
    } catch (error: any) {
      setLoading(false);
      console.error("Login trigger error:", error);
    }
  };

  const logout = async () => {
    if (!firebaseAuth) return;
    setLoading(true);
    await signOut(firebaseAuth);
    router.push("/login");
    setLoading(false);
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
