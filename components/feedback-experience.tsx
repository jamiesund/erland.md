"use client";

import { useRef, useState } from "react";
import { FeedbackForm } from "@/components/feedback-form";
import { SiteHeader, useMarkdownCopy } from "@/components/site-header";

export function FeedbackExperience({ markdown }: { markdown: string }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const { copied, ringing, copyError, copyFile, showNote } = useMarkdownCopy(markdown, pageRef);

  return (
    <div ref={pageRef} className={["page feedback-page", copied ? "is-copied" : "", ringing ? "is-ringing" : ""].filter(Boolean).join(" ")}>
      <SiteHeader copied={copied} copyError={copyError} showNote={showNote} onCopy={copyFile} />
      <main className="feedback">
        <div className="shell feedback-inner">
          {sent ? null : <h1>What feedback do you have?</h1>}
          <FeedbackForm onSent={() => setSent(true)} />
        </div>
      </main>
    </div>
  );
}
