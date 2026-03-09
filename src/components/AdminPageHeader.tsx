
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  showBackButton?: boolean;
  centered?: boolean;
}

/**
 * AdminPageHeader Component
 * 
 * A reusable header for administrative pages. Features a professional blue 
 * background with optional text centering and an optional navigation button.
 */
export function AdminPageHeader({ 
  title, 
  description, 
  showBackButton = true,
  centered = false 
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className={cn(
        "bg-[#0C46A3] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden",
        centered && "text-center"
      )}>
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        
        <div className={cn(
          "relative z-10 flex flex-col md:flex-row gap-6",
          centered ? "items-center" : "md:items-start justify-between"
        )}>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className={cn(
              "text-blue-100 mt-2 font-medium max-w-2xl",
              centered && "mx-auto"
            )}>
              {description}
            </p>
          </div>
          
          {showBackButton && (
            <Link href="/dashboard">
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-blue-50 font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
