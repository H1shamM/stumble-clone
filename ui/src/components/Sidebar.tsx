import { Compass, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CATEGORIES, Category } from "../constants";

interface SidebarProps {
  category: Category;
  onCategoryChange: (cat: Category) => void;
  isInstallable: boolean;
  onInstall: () => void;
}

export function Sidebar({
  category,
  onCategoryChange,
  isInstallable,
  onInstall,
}: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-5">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Compass className="size-5" />
        </div>
        <span className="text-base font-semibold tracking-tight">
          StumbleClone
        </span>
      </div>

      {/* Category nav */}
      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
          Browse
        </p>
        {CATEGORIES.map(({ value, label, icon: Icon }) => {
          const active = category === value;
          return (
            <button
              key={value}
              onClick={() => onCategoryChange(value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto">
        {isInstallable && (
          <Button
            variant="outline"
            onClick={onInstall}
            className="w-full justify-start gap-2"
          >
            <Download className="size-4" />
            Install app
          </Button>
        )}
      </div>
    </aside>
  );
}
