import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ViewModeToggle } from "./ViewModeToggle";

describe("ViewModeToggle", () => {
  afterEach(cleanup);

  it("renders a Reader and a Live button", () => {
    render(<ViewModeToggle mode="reader" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /reader/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /live/i })).toBeInTheDocument();
  });

  it("sets aria-pressed correctly based on mode", () => {
    const { rerender } = render(<ViewModeToggle mode="reader" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /reader/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /live/i })).toHaveAttribute("aria-pressed", "false");

    rerender(<ViewModeToggle mode="live" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /reader/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /live/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange when clicking buttons", () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="reader" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /live/i }));
    expect(onChange).toHaveBeenCalledWith("live");
  });
});
