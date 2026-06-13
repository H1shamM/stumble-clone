import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  ClaudeExplainer,
  ExplainerTruncatedError,
  ExplainerUnavailableError,
} from "../../../app/src/adapters/claudeExplainer";

// Inject a fake SDK client (DI) so no real network call is made.
const createMock = vi.fn();
const fakeClient = {
  messages: { create: createMock },
} as unknown as Anthropic;

const make = () => new ClaudeExplainer("test-key", fakeClient);

const draft = {
  summary: "A speck-sized animal that shrugs off almost anything.",
  keyPoints: ["smaller than a grain of salt", "survives space"],
  scenes: [
    {
      heading: "It refused to die",
      body: "Boiled, frozen, irradiated.",
      emoji: "🐻",
    },
    { heading: "The off switch", body: "It turns its insides to glass." }, // emoji omitted
  ],
};

describe("ClaudeExplainer", () => {
  beforeEach(() => createMock.mockReset());

  it("parses a valid structured response into a typed draft (emoji optional)", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(draft) }],
    });

    const result = await make().summarize({ title: "Tardigrade", text: "..." });

    expect(result.summary).toBe(draft.summary);
    expect(result.keyPoints).toEqual(draft.keyPoints);
    expect(result.scenes).toHaveLength(2);
    expect(result.scenes[0]?.emoji).toBe("🐻");
    expect(result.scenes[1]?.emoji).toBeUndefined();
  });

  it("throws ExplainerTruncatedError on max_tokens and never parses the partial", async () => {
    createMock.mockResolvedValue({
      stop_reason: "max_tokens",
      // Deliberately invalid/truncated JSON — must NOT be parsed.
      content: [{ type: "text", text: '{"summary":"partial' }],
    });

    await expect(
      make().summarize({ title: "X", text: "..." }),
    ).rejects.toBeInstanceOf(ExplainerTruncatedError);
  });

  it("throws ExplainerUnavailableError on a failure path (non-JSON output)", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "not json at all" }],
    });

    await expect(
      make().summarize({ title: "X", text: "..." }),
    ).rejects.toBeInstanceOf(ExplainerUnavailableError);
  });

  it("requires an API key when no client is injected", () => {
    expect(() => new ClaudeExplainer(undefined)).toThrow(/ANTHROPIC_API_KEY/);
  });
});
