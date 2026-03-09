
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
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
        role: "user",
        collegeOffice: "",
        isSetupComplete: false,
        isBlocked: false,
      };
      await setDoc(docRef, newProfile);
      setProfile(newProfile);
      return newProfile;
    }
  };

  useEffect(() => {
    if (!firebaseAuth) return;

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
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
        const userProfile = await syncProfile(firebaseUser);
        
        if (userProfile.isBlocked && pathname !== "/access-denied") {
          router.push("/access-denied");
        } else if (!userProfile.isSetupComplete && pathname !== "/onboarding") {
          router.push("/onboarding");
        } else if (userProfile.isSetupComplete) {
          // All authenticated and set up users now land on the Home Dashboard (/)
          if (pathname === "/login" || pathname === "/onboarding") {
            router.push("/");
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseAuth, pathname, router, toast]);

  const login = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred during sign in.",
        });
      }
    }
  };

  const logout = async () => {
    await signOut(firebaseAuth);
    router.push("/login");
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
