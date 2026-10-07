"use client";

import { usePathname } from "next/navigation";
import { FeedbackModal } from "@/components/feedback-modal";
import { HomeExperience } from "@/components/home-experience";

export function SiteShell({ markdown }: { markdown: string }) {
  const pathname = usePathname();

  return (
    <>
      <HomeExperience markdown={markdown} />
      {pathname === "/feedback" ? <FeedbackModal /> : null}
    </>
  );
}
