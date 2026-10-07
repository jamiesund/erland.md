"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackForm } from "@/components/feedback-form";
import { CloseIcon } from "@/components/icons";

export function FeedbackModal() {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("What feedback do you have?");

  function close() {
    router.push("/", { scroll: false });
  }

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus();
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
    <div className="log-backdrop feedback-backdrop" onClick={close}>
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
          <h2 id={titleId}>{title}</h2>
          <button className="pill log-close" type="button" aria-label="Close" onClick={close}>
            <CloseIcon />
          </button>
        </div>
        <FeedbackForm onStep={(step) => setTitle(step === "thanks" ? "Thanks" : "What feedback do you have?")} />
      </div>
    </div>
  );
}
