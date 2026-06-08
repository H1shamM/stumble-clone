import type { HistoryItem } from "../hooks/useHistory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HistoryPanelProps {
  history: HistoryItem[];
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  onStumble?: () => void;
}

export function HistoryPanel({
  history,
  showHistory,
  setShowHistory,
  onStumble,
}: HistoryPanelProps) {
  return (
    <div className="mt-space-6">
      <Button
        variant="outline"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full justify-between"
      >
        <span>{showHistory ? "🔽 Hide History" : "📋 View History"}</span>
        <span>({history.length})</span>
      </Button>
      {showHistory && (
        <Card className="mt-space-4">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-space-6 text-muted-foreground">
                <p>Your journey has just begun.</p>
                <Button onClick={onStumble} className="mt-space-2">
                  Explore now
                </Button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                {history.slice(0, 10).map((item) => (
                  <li
                    key={item.timestamp.toString()}
                    className="p-space-3 border rounded-md"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-accent"
                    >
                      {item.title || item.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
