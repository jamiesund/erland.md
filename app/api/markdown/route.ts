import { readMarkdownFile } from "@/lib/markdown";

export async function GET() {
  const markdown = await readMarkdownFile();
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
