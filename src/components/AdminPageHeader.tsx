
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  description: string;
}

/**
 * AdminPageHeader Component
 * 
 * A reusable header for administrative pages featuring a blue background,
 * white text, and a prominently placed navigation button in the top-right
 * corner that leads back to the main user dashboard.
 */
export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="bg-[#0C46A3] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="text-blue-100 mt-2 font-medium max-w-2xl">
              {description}
            </p>
          </div>
          
          <Link href="/dashboard">
            <Button 
              variant="secondary" 
              className="bg-white text-primary hover:bg-blue-50 font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to User Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
