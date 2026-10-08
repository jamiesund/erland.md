"use client";

import Link from "next/link";
import { markFeedbackHandoff } from "@/components/feedback-modal";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import { lockPageScroll, unlockPageScroll } from "@/lib/scroll-lock";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

export const currentVersion = "V1.0";

const RELEASES = [
  {
    version: currentVersion,
    date: "8 October 2026, 13:46",
    dateTime: "2026-10-08T13:46",
    summary: "This is all a bit of an experiment into markdown files. So a baby is born. Created from multiple conversations with Claude into how I think about design problems based on my experience. This version includes:",
    covers: [
      "How the chat should open, listen, and stay honest about who it is",
      "Questions that unlock thinking, and making space to sit with them",
      "How I sketch, formalise, and test with real people",
      "Scope, trust, and reciprocity, from what I've shipped",
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

const VersionLogContext = createContext<ReturnType<typeof useVersionLog> | null>(null);

export function VersionLogProvider({ children }: { children: ReactNode }) {
  const log = useVersionLog();
  return (
    <VersionLogContext.Provider value={log}>
      {children}
      <VersionLog open={log.open} onClose={log.closeLog} />
    </VersionLogContext.Provider>
  );
}

function useSharedVersionLog() {
  const log = useContext(VersionLogContext);
  if (!log) throw new Error("VersionLogProvider is missing");
  return log;
}

export function VersionButton() {
  const { pressed, open, openLog } = useSharedVersionLog();

  return (
    <button
      className={pressed ? "version is-pressed" : "version"}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={openLog}
    >
      <span>{currentVersion}</span>
    </button>
  );
}

const HANDOFF_MS = 680;

export function VersionLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const closeTimer = useRef<number | null>(null);

  function handoff(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    leavingRef.current = true;
    setLeaving(true);
    markFeedbackHandoff();
  }

  useEffect(() => {
    if (!leaving || closeTimer.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, reduceMotion ? 0 : HANDOFF_MS);
  }, [leaving, onClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
      if (!leavingRef.current && !coarse && previous instanceof HTMLElement) previous.focus();
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
  const { pressed, open, openLog } = useSharedVersionLog();

  return (
    <button
      className={pressed ? "brand-lockup is-pressed" : "brand-lockup"}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={openLog}
    >
      <span className="brand">Jamiesunderland.md</span>
      <span className="version">
        <span>{currentVersion}</span>
      </span>
    </button>
  );
}
