/**
 * @fileoverview Claude-backed adapter for the `ExplainerLLM` port. Isolated here
 * (hexagonal: port in `services/`, adapter in `adapters/`) so the model and
 * provider are swappable in one place. Uses Haiku 4.5 — cheap and plenty capable
 * for this re-tell task — with structured outputs (GA for Haiku 4.5, no beta
 * header) so the response is schema-valid JSON. Guards truncation so a partial
 * response is never parsed.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  EnrichmentDraft,
  ExplainerLLM,
} from "../services/enrichmentService.js";
import { EXPLAINER_PROMPT } from "../prompts/explainerPrompt.js";

// Haiku 4.5: ~5x cheaper than Opus, and this re-tell/summarize task is exactly
// where it's strong — the right call for a cost-bounded, cached feature.
const MODEL = "claude-haiku-4-5";
/** Cap the article we send so token cost stays bounded on long pages. */
const MAX_INPUT_CHARS = 12_000;
/** Headroom for a full 4–6 scene reel + summary + key points without truncating. */
const MAX_TOKENS = 1800;

/** The model ran out of output budget mid-response — the JSON is incomplete. */
export class ExplainerTruncatedError extends Error {
  constructor() {
    super("Explainer response was truncated (stop_reason: max_tokens)");
    this.name = "ExplainerTruncatedError";
  }
}

/** The upstream LLM call failed (network, API error, malformed output). */
export class ExplainerUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExplainerUnavailableError";
  }
}

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          body: { type: "string" },
          emoji: { type: "string" },
        },
        // emoji is optional so somber subjects aren't forced a cheerful glyph.
        required: ["heading", "body"],
      },
    },
  },
  required: ["summary", "keyPoints", "scenes"],
} as const;

export class ClaudeExplainer implements ExplainerLLM {
  private readonly client: Anthropic;

  /**
   * @param apiKey  defaults to ANTHROPIC_API_KEY from the environment.
   * @param client  optional pre-built client — for tests (inject a fake SDK).
   */
  constructor(
    apiKey: string | undefined = process.env.ANTHROPIC_API_KEY,
    client?: Anthropic,
  ) {
    if (client) {
      this.client = client;
      return;
    }
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  async summarize(input: {
    title: string;
    text: string;
  }): Promise<EnrichmentDraft> {
    const text = input.text.slice(0, MAX_INPUT_CHARS);

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: EXPLAINER_PROMPT,
        messages: [
          {
            role: "user",
            content:
              `Title: ${input.title}\n\nArticle:\n${text}\n\n` +
              "Write a 2–4 sentence lively summary, 3–5 short punchy takeaways, " +
              "and a 4–6 scene explainer reel (heading + 1–2 sentences + an emoji " +
              "where it fits).",
          },
        ],
        output_config: {
          format: { type: "json_schema", schema: OUTPUT_SCHEMA },
        },
      });
    } catch (err) {
      throw new ExplainerUnavailableError("Explainer API call failed", {
        cause: err,
      });
    }

    // Never JSON.parse a truncated response — the JSON is incomplete.
    if (response.stop_reason === "max_tokens") {
      throw new ExplainerTruncatedError();
    }

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new ExplainerUnavailableError("Explainer returned no text block");
    }

    try {
      return JSON.parse(block.text) as EnrichmentDraft;
    } catch (err) {
      throw new ExplainerUnavailableError("Explainer returned invalid JSON", {
        cause: err,
      });
    }
  }
}
