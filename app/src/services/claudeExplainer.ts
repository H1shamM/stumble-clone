/**
 * @fileoverview Claude-backed implementation of the `ExplainerLLM` port. Kept
 * separate from `enrichmentService` so the service stays pure and testable and
 * the model is swappable here in one place. Uses the official Anthropic SDK with
 * Opus 4.8 + structured outputs so the response is schema-valid JSON.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { EnrichmentDraft, ExplainerLLM } from "./enrichmentService.js";

const MODEL = "claude-opus-4-8";
/** Cap the article we send so token cost stays bounded on long pages. */
const MAX_INPUT_CHARS = 12_000;

const SYSTEM_PROMPT =
  "You turn dense reference articles into a fun, vivid explainer — the " +
  "'simplify the science so people enjoy learning it' style that makes people " +
  "want to share what they just read. Keep it short, concrete, and lively, and " +
  "use a plain everyday analogy where it earns its place. Never invent facts " +
  "beyond what the article supports.";

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "keyPoints"],
} as const;

export class ClaudeExplainer implements ExplainerLLM {
  private readonly client: Anthropic;

  constructor(apiKey: string | undefined = process.env.ANTHROPIC_API_KEY) {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  async summarize(input: {
    title: string;
    text: string;
  }): Promise<EnrichmentDraft> {
    const text = input.text.slice(0, MAX_INPUT_CHARS);

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            `Title: ${input.title}\n\nArticle:\n${text}\n\n` +
            "Write a 2–4 sentence lively summary and 3–5 short, punchy " +
            "takeaways.",
        },
      ],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });

    const block = response.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "{}";
    return JSON.parse(raw) as EnrichmentDraft;
  }
}
