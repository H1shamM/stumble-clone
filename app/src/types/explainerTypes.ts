export interface ExplainerScene {
  heading: string;
  body: string;
  emoji?: string;
}

export interface EnrichmentDraft {
  summary: string;
  keyPoints: string[];
  scenes: ExplainerScene[];
}

export interface ExplainerLLM {
  summarize(input: { title: string; text: string }): Promise<EnrichmentDraft>;
}

export interface EnrichmentResult extends EnrichmentDraft {
  image: string | null;
  provenance: string;
  sourceUrl: string;
}
