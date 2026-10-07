"use client";

import Link from "next/link";
import { markFeedbackHandoff } from "@/components/feedback-modal";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";

const RELEASES = [
  {
    version: "V1.0",
    date: "6 October 2026",
    dateTime: "2026-10-06",
    summary: "The first version of the file. Paste it into Claude, Cursor, or any chat and it has the context for working through a design problem.",
    covers: [
      "How to use the file, and how the chat should behave",
      "Who I am, and how I think",
      "How I work, from a sketch through to testing with real people",
      "Scope, trust, and reciprocity",
    ],
  },
];

const PRESS_MS = 160;

export function useVersionLog() {
  const pressTimer = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const [open, setOpen] = useState(false);

  function openLog() {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setOpen(true);
      return;
    }
    setPressed(true);
    pressTimer.current = window.setTimeout(() => {
      setPressed(false);
      setOpen(true);
    }, PRESS_MS);
  }

  useEffect(() => {
    return () => {
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
    };
  }, []);

  const closeLog = useCallback(() => setOpen(false), []);

  return { pressed, open, openLog, closeLog };
}

const HANDOFF_MS = 680;

export function VersionLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  function handoff(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    leavingRef.current = true;
    setLeaving(true);
    markFeedbackHandoff();
  }

  useEffect(() => {
    if (!leaving) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClose, reduceMotion ? 0 : HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (!document.querySelector(".feedback-backdrop")) document.body.style.overflow = previousOverflow;
      if (!leavingRef.current && previous instanceof HTMLElement) previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={leaving ? "log-backdrop is-leaving" : "log-backdrop"} onClick={onClose}>
      <div
        ref={dialogRef}
        className={leaving ? "log is-leaving" : "log"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="log-head">
          <h2 id={titleId}>Versions</h2>
          <button className="pill log-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {RELEASES.map((release) => (
          <article className="log-release" key={release.version}>
            <header>
              <h3>{release.version}</h3>
              <time dateTime={release.dateTime}>{release.date}</time>
            </header>
            <p>{release.summary}</p>
            <div className="log-notes">
              <ul>
                {release.covers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <hr className="log-rule" />
              <Link
                className="pill log-feedback"
                href="/feedback"
                scroll={false}
                onClick={handoff}
              >
                Give feedback
                <ChevronIcon />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Brand() {
  const pathname = usePathname();
  const { pressed, open, openLog, closeLog } = useVersionLog();

  function onBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/") return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <span className="brand-lockup">
      <Link className="brand" href="/" onClick={onBrandClick}>
        <span>Jamiesunderland.md</span>
      </Link>
      <button
        className={pressed ? "version is-pressed" : "version"}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openLog}
      >
        <span>V1.0</span>
      </button>
      <VersionLog open={open} onClose={closeLog} />
    </span>
  );
}
