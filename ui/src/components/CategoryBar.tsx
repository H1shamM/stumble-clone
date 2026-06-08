import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CategoryBarProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export function CategoryBar({
  category,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
}: CategoryBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-space-4 p-space-4 bg-bg-card rounded-lg border border-border">
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="tech">Tech</SelectItem>
          <SelectItem value="art">Art</SelectItem>
          <SelectItem value="science">Science</SelectItem>
          <SelectItem value="random">Random</SelectItem>
        </SelectContent>
      </Select>

      <form onSubmit={onSearchSubmit} className="flex gap-space-2 w-full">
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm flex-1"
        />
        <Button type="submit">Search</Button>
      </form>
    </div>
  );
}
