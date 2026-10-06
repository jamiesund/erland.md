import type { Metadata } from "next";
import { HomeExperience } from "@/components/home-experience";
import { readMarkdownFile } from "@/lib/markdown";

export const metadata: Metadata = {
  title: {
    absolute: "Jamiesunderland.md • Chat through your design problems with me",
  },
};

export default async function Home() {
  const markdown = await readMarkdownFile();
  return <HomeExperience markdown={markdown} />;
}
