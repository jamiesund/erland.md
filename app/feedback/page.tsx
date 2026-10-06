import type { Metadata } from "next";
import { FeedbackExperience } from "@/components/feedback-experience";
import { readMarkdownFile } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Send Jamie a note about the markdown file.",
};

export default async function FeedbackPage() {
  const markdown = await readMarkdownFile();
  return <FeedbackExperience markdown={markdown} />;
}
