import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";
import type { ReactNode } from "react";

// Mock Radix UI's DropdownMenu components to just render children
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    onClick,
    children,
  }: {
    onClick: () => void;
    children: ReactNode;
  }) => <button onClick={onClick}>{children}</button>,
}));

describe("Header", () => {
  it("calls onLogout and onUserClick correctly", () => {
    const onLogout = vi.fn();
    const onUserClick = vi.fn();
    render(
      <Header
        darkMode={false}
        setDarkMode={vi.fn()}
        user={{ id: "1", email: "test@test.com" }}
        onUserClick={onUserClick}
        onLogout={onLogout}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSearchSubmit={vi.fn()}
        category="all"
        onCategoryChange={vi.fn()}
        categories={[{ value: "all", label: "Discover" }]}
      />
    );

    const logoutButtons = screen.getAllByRole("button", { name: /Logout/i });
    fireEvent.click(logoutButtons[0]);
    expect(onLogout).toHaveBeenCalled();
    expect(onUserClick).not.toHaveBeenCalled();

    const profileButtons = screen.getAllByRole("button", { name: /Profile/i });
    fireEvent.click(profileButtons[0]);
    expect(onUserClick).toHaveBeenCalled();
  });

  it("renders category selector for mobile", () => {
    render(
      <Header
        darkMode={false}
        setDarkMode={vi.fn()}
        user={null}
        onUserClick={vi.fn()}
        onLogout={vi.fn()}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSearchSubmit={vi.fn()}
        category="all"
        onCategoryChange={vi.fn()}
        categories={[{ value: "all", label: "Discover" }]}
      />
    );
    // Should be able to find the Browse/Discover button
    const discoverButtons = screen.getAllByText("Discover");
    expect(discoverButtons[0]).toBeInTheDocument();
  });
});
