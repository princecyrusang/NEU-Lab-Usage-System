
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
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

  useEffect(() => {
    if (!firebaseAuth || !firestore) return;

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
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
        
        setUser(firebaseUser);

        // Set up real-time listener for the user profile
        const profileRef = doc(firestore, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // Document doesn't exist yet, create it with defaults
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email?.toLowerCase() || "",
              fullName: firebaseUser.displayName || "Institutional Member",
              role: "Professor",
              collegeOffice: "",
              isSetupComplete: false,
              isBlocked: false,
            };
            
            try {
              await setDoc(profileRef, newProfile, { merge: true });
              // Snapshot will trigger again automatically after creation
            } catch (err) {
              console.error("Profile creation error:", err);
              setLoading(false);
            }
          }
        }, (error) => {
          console.error("Profile listener error:", error);
          setLoading(false);
        });

      } else {
        setUser(null);
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [firebaseAuth, firestore, toast]);

  useEffect(() => {
    if (loading) return;

    const cleanPath = pathname?.replace(/\/$/, '') || "";
    const isLoginPage = cleanPath === "/login" || cleanPath === "" || cleanPath === "/index.html";

    if (user && profile) {
      if (isLoginPage) {
        window.location.href = "/dashboard/";
      }
    } else if (!user && !isLoginPage) {
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
