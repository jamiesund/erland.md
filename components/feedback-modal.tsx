"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarCascade, noteAvatarResidue } from "@/components/avatar-cascade";
import { FeedbackForm, useEmailPreview } from "@/components/feedback-form";
import { CloseIcon } from "@/components/icons";
import { lockPageScroll, unlockPageScroll } from "@/lib/scroll-lock";

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
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailPreview = useEmailPreview();
  const [title, setTitle] = useState("What feedback do you have?");
  const [fromLog] = useState(consumeFeedbackHandoff);
  const [celebrating, setCelebrating] = useState(false);
  const heading = emailPreview ? "Thanks for that" : title;

  function close() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
    const backdrop = backdropRef.current;
    const viewport = window.visualViewport;
    if (!backdrop || !viewport) return;

    const sync = () => {
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      const keyboard = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height);
      const open = mobile && keyboard > 150;
      backdrop.classList.toggle("is-keyboard", open);
      backdrop.style.transform = "";
      if (!open) return;
      const gap = backdrop.getBoundingClientRect().bottom - viewport.height;
      if (gap > 0.5) backdrop.style.transform = `translate3d(0, ${-gap}px, 0)`;
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    backdrop.addEventListener("focusin", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      backdrop.removeEventListener("focusin", sync);
      backdrop.classList.remove("is-keyboard");
      backdrop.style.transform = "";
    };
  }, []);

  useLayoutEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    const preview =
      process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search).get("preview") : null;
    if (preview !== "email" && preview !== "sent") dialog?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/", { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    lockPageScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      dialog?.setAttribute("aria-modal", "false");
      if (document.activeElement instanceof HTMLElement && dialog?.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      unlockPageScroll();
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (!coarse && previous instanceof HTMLElement) previous.focus();
    };
  }, [router]);

  return (
    <div
      ref={backdropRef}
      className={fromLog ? "log-backdrop feedback-backdrop is-handoff" : "log-backdrop feedback-backdrop"}
      onClick={close}
    >
      {celebrating ? <AvatarCascade /> : null}
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
          onCelebrate={() => {
            setCelebrating(true);
            noteAvatarResidue("email");
          }}
          onStep={(step) => setTitle(step === "thanks" ? "Thanks for that" : "What feedback do you have?")}
        />
      </div>
    </div>
  );
}
