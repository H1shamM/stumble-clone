import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  type?: "stumble" | "list" | "card";
  count?: number;
}

export function SkeletonLoader({
  type = "stumble",
  count = 1,
}: SkeletonLoaderProps) {
  if (type === "stumble") {
    return (
      <div className="flex flex-col gap-space-4 p-space-6 border rounded-lg">
        <Skeleton className="h-8 w-[60%] mx-auto" />
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[40%]" />
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-space-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-space-2">
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-3 w-[60%] mt-space-1" />
          </div>
        ))}
      </div>
    );
  }

  // card type
  return (
    <div className="p-space-4 border rounded-md space-y-space-2">
      <Skeleton className="h-5 w-[70%]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[50%]" />
    </div>
  );
}
