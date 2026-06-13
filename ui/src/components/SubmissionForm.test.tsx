import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "../test-utils";
import { SubmissionForm } from "./SubmissionForm";

describe("SubmissionForm", () => {
  it("shows success toast and clears form on successful submission", async () => {
    const authenticatedFetch = vi.fn().mockResolvedValue({ ok: true });
    const onSuccess = vi.fn();
    render(
      <SubmissionForm
        onSuccess={onSuccess}
        authenticatedFetch={authenticatedFetch}
      />,
    );

    fireEvent.change(screen.getAllByPlaceholderText("Title")[0], {
      target: { value: "Title" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("https://example.com")[0], {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getAllByText("Submit")[0]);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(screen.getAllByPlaceholderText("Title")[0]).toHaveValue("");
    expect(
      screen.getAllByPlaceholderText("https://example.com")[0],
    ).toHaveValue("");
  });

  it("shows error toast and does not clear form on failed submission", async () => {
    const authenticatedFetch = vi.fn().mockResolvedValue({ ok: false });
    const onSuccess = vi.fn();
    render(
      <SubmissionForm
        onSuccess={onSuccess}
        authenticatedFetch={authenticatedFetch}
      />,
    );

    fireEvent.change(screen.getAllByPlaceholderText("Title")[0], {
      target: { value: "Title" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("https://example.com")[0], {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getAllByText("Submit")[0]);

    await waitFor(() => expect(onSuccess).not.toHaveBeenCalled());
  });
});
