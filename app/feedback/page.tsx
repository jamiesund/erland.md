import type { Metadata } from "next";
import { siteUrl } from "@/lib/links";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Send Jamie a note about the markdown file.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${siteUrl}/feedback`,
  },
};

export default function FeedbackPage() {
  return null;
}
