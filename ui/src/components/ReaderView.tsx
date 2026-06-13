import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReaderViewProps {
  title: string;
  byline?: string | null;
  siteName?: string | null;
  content: string; // sanitized HTML from the backend
}

export function ReaderView({
  title,
  byline,
  siteName,
  content,
}: ReaderViewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {(siteName || byline) && (
          <div className="text-sm text-muted-foreground">
            {siteName} {byline && `by ${byline}`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* HTML is sanitized server-side by the backend */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
}
