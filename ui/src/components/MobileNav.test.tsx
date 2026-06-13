import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MobileNav } from "./MobileNav";
import { CATEGORIES } from "./categories";

describe("MobileNav", () => {
  it("renders all categories when opened", async () => {
    const onCategoryChange = vi.fn();
    render(<MobileNav category="all" onCategoryChange={onCategoryChange} />);

    // Trigger open
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    // Verify all categories are listed
    for (const cat of CATEGORIES) {
      expect(
        screen.getByRole("button", { name: cat.label }),
      ).toBeInTheDocument();
    }
  });

  it("calls onCategoryChange when a category is clicked", async () => {
    const onCategoryChange = vi.fn();
    render(<MobileNav category="all" onCategoryChange={onCategoryChange} />);

    // Trigger open
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    // Click Tech
    fireEvent.click(screen.getByRole("button", { name: /tech/i }));

    expect(onCategoryChange).toHaveBeenCalledWith("tech");
  });
});
