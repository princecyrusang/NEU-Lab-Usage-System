
"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { DoorOpen, LayoutDashboard, Users, BarChart3, LogOut, Menu, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Manage Users", icon: Users, href: "/admin/users" },
  { label: "Reports", icon: BarChart3, href: "/admin/reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !loading && profile?.role !== "Admin") {
      router.push("/dashboard");
    }
  }, [isMounted, loading, profile, router]);

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF1F6]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (profile?.role !== "Admin") return null;

  const NavLinks = () => (
    <nav className="flex flex-col gap-2">
      {NAV_ITEMS.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          onClick={() => setIsOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            pathname === item.href 
              ? "bg-primary text-white shadow-md" 
              : "text-muted-foreground hover:bg-accent hover:text-primary"
          }`}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#EEF1F6] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col p-6 shadow-sm sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-primary mb-10 px-2">
          <DoorOpen className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight leading-tight">NEU LAB ROOM Admin</span>
        </div>
        
        <div className="flex-1">
          <NavLinks />
        </div>

        <div className="pt-6 border-t space-y-4">
          <div className="px-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Authenticated as</p>
            <p className="text-sm font-semibold truncate">{profile.fullName}</p>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 border-destructive/30" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <DoorOpen className="w-6 h-6" />
          <span className="font-bold">NEU LAB ROOM</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex items-center gap-3 text-primary mb-10 mt-6 px-2">
              <DoorOpen className="w-8 h-8" />
              <span className="font-bold text-xl leading-tight">NEU LAB ROOM Admin</span>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
