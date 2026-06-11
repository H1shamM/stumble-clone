import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function ExplainerSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-6" role="status" aria-label="Loading explainer">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </Card>
  );
}

export function ExplainerUnavailableCard({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Explainer unavailable</h2>
        <p className="text-sm text-muted-foreground">
          We couldn't generate an explainer for this article right now.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
