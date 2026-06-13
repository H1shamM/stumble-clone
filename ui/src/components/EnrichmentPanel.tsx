import { Card } from "@/components/ui/card";
import type { EnrichmentResult } from "../hooks/useExplainer";

interface EnrichmentPanelProps {
  enrichment: EnrichmentResult;
}

export function EnrichmentPanel({ enrichment }: EnrichmentPanelProps) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      {enrichment.image && (
        <img
          src={enrichment.image}
          alt="Enrichment illustration"
          className="h-64 w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}
      <h2 className="text-xl font-semibold">AI Summary</h2>
      <p className="text-sm text-muted-foreground">{enrichment.summary}</p>

      {enrichment.keyPoints.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Key Points</h3>
          <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
            {enrichment.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">
        {enrichment.provenance}
      </p>

      <a
        href={enrichment.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-primary hover:underline"
      >
        Read the original
      </a>
    </Card>
  );
}
