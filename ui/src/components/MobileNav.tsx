import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORIES, type Category } from "./categories";
import { useState } from "react";

interface MobileNavProps {
  category: Category;
  onCategoryChange: (cat: Category) => void;
}

export function MobileNav({ category, onCategoryChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Menu</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? "secondary" : "ghost"}
              onClick={() => {
                onCategoryChange(cat.value);
                setOpen(false);
              }}
              className="justify-start"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
