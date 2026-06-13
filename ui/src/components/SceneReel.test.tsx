import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SceneReel } from "./SceneReel";
import type { ExplainerScene } from "../hooks/useExplainer";

afterEach(cleanup);

const scenes: ExplainerScene[] = [
  {
    heading: "We tried to kill it",
    body: "Boiled, frozen, irradiated.",
    emoji: "🐻",
  },
  {
    heading: "The off switch",
    body: "It turns its insides to glass.",
    emoji: "🧊",
  },
  { heading: "Tested in space", body: "It came back fine.", emoji: "🚀" },
];

const baseProps = {
  title: "The Animal That Refuses to Die",
  summary: "Tardigrades survive almost anything.",
  keyPoints: ["Smaller than a grain of salt", "Can pause life for years"],
  scenes,
  provenance: "AI summary of Wikipedia",
  sourceUrl: "https://en.wikipedia.org/wiki/Tardigrade",
};

describe("SceneReel", () => {
  it("renders cover, scenes and recap with counter", () => {
    render(<SceneReel {...baseProps} />);
    // Cover title + first scene + recap key points all present in the track.
    expect(
      screen.getByText("The Animal That Refuses to Die"),
    ).toBeInTheDocument();
    expect(screen.getByText("We tried to kill it")).toBeInTheDocument();
    expect(screen.getByText("Tested in space")).toBeInTheDocument();
    expect(
      screen.getByText("Smaller than a grain of salt"),
    ).toBeInTheDocument();
    // cover + 3 scenes + recap = 5 slides
    expect(screen.getAllByText("1 / 5").length).toBeGreaterThan(0);
  });

  it("advances with the Next button", () => {
    render(<SceneReel {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getAllByText("2 / 5").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "← Back" })).not.toBeDisabled();
  });

  it("disables Back on the first slide", () => {
    render(<SceneReel {...baseProps} />);
    expect(screen.getByRole("button", { name: "← Back" })).toBeDisabled();
  });

  it("shows provenance and a CC BY-SA note for Wikipedia, with the original link", () => {
    render(<SceneReel {...baseProps} />);
    expect(screen.getByText(/AI summary of Wikipedia/)).toBeInTheDocument();
    expect(screen.getByText(/CC BY-SA/)).toBeInTheDocument();
    // The recap slide is off-screen (aria-hidden) until navigated to, so include hidden.
    expect(
      screen.getByRole("link", { name: /read the original/i, hidden: true }),
    ).toHaveAttribute("href", baseProps.sourceUrl);
  });

  it("omits the CC BY-SA note for non-Wikipedia sources", () => {
    render(
      <SceneReel
        {...baseProps}
        provenance="AI summary of Coding Horror"
        sourceUrl="https://blog.codinghorror.com/x/"
      />,
    );
    expect(screen.queryByText(/CC BY-SA/)).not.toBeInTheDocument();
  });

  it("shows a loading skeleton", () => {
    const { container } = render(<SceneReel {...baseProps} loading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
