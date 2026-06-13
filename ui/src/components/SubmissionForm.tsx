import { useState } from "react";
import type { FormEvent } from "react";
import { PlusCircle, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "../contexts/ToastContext";

/**
 * Props for the SubmissionForm component.
 */
interface Props {
  onSuccess: () => void;
  authenticatedFetch: (url: string, options: RequestInit) => Promise<Response>;
}

/**
 * Card form for submitting a new link to the community queue.
 */
export function SubmissionForm({ onSuccess, authenticatedFetch }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authenticatedFetch(
        "http://localhost:3000/api/v1/submissions",
        {
          method: "POST",
          body: JSON.stringify({ url, title }),
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        addToast("Submission failed", "error");
        return;
      }
      setUrl("");
      setTitle("");
      onSuccess();
    } catch (err) {
      console.error("Submission failed", err);
      addToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="size-4 text-primary" />
          Submit a link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="sm:flex-1"
          />
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="sm:flex-1"
          />
          <Button type="submit" disabled={loading} className="gap-2">
            <Send className="size-4" />
            {loading ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
