"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackForm, useEmailPreview } from "@/components/feedback-form";
import { CloseIcon } from "@/components/icons";

let handoffToFeedback = false;

export function markFeedbackHandoff() {
  handoffToFeedback = true;
}

function consumeFeedbackHandoff() {
  return handoffToFeedback;
}

export function FeedbackModal() {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailPreview = useEmailPreview();
  const [title, setTitle] = useState("What feedback do you have?");
  const [fromLog] = useState(consumeFeedbackHandoff);
  const heading = emailPreview ? "Thanks for that" : title;

  function close() {
    router.push("/", { scroll: false });
  }

  useEffect(() => {
    if (!fromLog) return;
    const timer = window.setTimeout(() => {
      handoffToFeedback = false;
    }, 700);
    return () => window.clearTimeout(timer);
  }, [fromLog]);

  useEffect(() => {
    const previous = document.activeElement;
    const preview =
      process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search).get("preview") : null;
    if (preview !== "email" && preview !== "sent") dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/", { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [router]);

  return (
    <div className={fromLog ? "log-backdrop feedback-backdrop is-handoff" : "log-backdrop feedback-backdrop"} onClick={close}>
      <div
        ref={dialogRef}
        className="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="feedback-head">
          <h2 id={titleId}>{heading}</h2>
          <button className="pill log-close" type="button" aria-label="Close" onClick={close}>
            <CloseIcon />
          </button>
        </div>
        <FeedbackForm
          onClose={close}
          onStep={(step) => setTitle(step === "thanks" ? "Thanks for that" : "What feedback do you have?")}
        />
      </div>
    </div>
  );
}
