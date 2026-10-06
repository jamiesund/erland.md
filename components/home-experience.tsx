"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DotsIcon } from "@/components/icons";
import { CopyControl, SiteHeader, useMarkdownCopy, COPIED_HOLD_MS, BANNER_EXIT_MS } from "@/components/site-header";

const showTimingTuner = false;
const DEFAULT_TIMING = {
  hold: 800,
  lead: 3000,
  leave: 800,
  enter: 350,
  dotCycle: 1100,
  dotStagger: 120,
};

type Timing = typeof DEFAULT_TIMING;

function resolveTiming(value: Partial<Timing>): Timing {
  return {
    hold: value.hold ?? DEFAULT_TIMING.hold,
    lead: value.lead ?? DEFAULT_TIMING.lead,
    leave: value.leave ?? DEFAULT_TIMING.leave,
    enter: value.enter ?? DEFAULT_TIMING.enter,
    dotCycle: value.dotCycle ?? DEFAULT_TIMING.dotCycle,
    dotStagger: value.dotStagger ?? DEFAULT_TIMING.dotStagger,
  };
}

const HEADLINES = [
  <>
    Chat through your design
    <br />
    problems with me
  </>,
  "I'll ask you questions so you can explore your thinking",
  <>
    Ready to try? Copy
    <br />
    <span className="line-desktop">or open in your AI chat</span>
    <span className="line-compact">and paste in your AI chat</span>
  </>,
];

export function HomeExperience({ markdown }: { markdown: string }) {
  const [headlineIndex, setHeadlineIndex] = useState<number | null>(null);
  const [headlinePhase, setHeadlinePhase] = useState<"shown" | "leaving">("shown");
  const [typing, setTyping] = useState(true);
  const [timing, setTiming] = useState<Timing>(DEFAULT_TIMING);
  const resolvedTiming = useMemo(() => resolveTiming(timing), [timing]);
  const [cycle, setCycle] = useState(0);
  const timingRef = useRef(timing);
  const pageRef = useRef<HTMLDivElement>(null);
  const { copied, ringing, copyError, copyFile, showNote } = useMarkdownCopy(markdown, pageRef);
  const copyBarRef = useRef<HTMLDivElement>(null);
  const [copyPinned, setCopyPinned] = useState(false);
  const lines = markdown.replace(/\n$/, "").split("\n");
  timingRef.current = resolvedTiming;

  useEffect(() => {
    const bar = copyBarRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const syncWidth = () => {
      root.style.setProperty("--page-width", `${root.clientWidth}px`);
    };
    const update = () => {
      const hidden = getComputedStyle(bar).display === "none";
      const bottom = bar.getBoundingClientRect().bottom;
      setCopyPinned((pinned) => {
        if (hidden) return false;
        return pinned ? bottom < 48 : bottom < 0;
      });
    };
    const onResize = () => {
      syncWidth();
      update();
    };
    syncWidth();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--page-width");
    };
  }, []);

  useLayoutEffect(() => {
    if (!copyPinned) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const moves: [string, string, boolean][] = [
      [".hero .avatar", ".scroll-avatar", true],
      [".copy-bar .copy-wide", ".scroll-nav .copy-wide", false],
    ];

    const animations = moves.flatMap(([fromSelector, toSelector, scale]) => {
      const from = document.querySelector(fromSelector);
      const to = document.querySelector(toSelector);
      if (!from || !to) return [];
      const start = from.getBoundingClientRect();
      const end = to.getBoundingClientRect();
      if (end.width === 0 || end.height === 0) return [];
      const limit = (value: number) => Math.max(-120, Math.min(120, value));
      const dx = limit(start.left + start.width / 2 - (end.left + end.width / 2));
      const dy = limit(start.top + start.height / 2 - (end.top + end.height / 2));
      const fromTransform = scale
        ? `translate(${dx}px, ${dy}px) scale(${start.width / end.width})`
        : `translate(${dx}px, ${dy}px)`;
      return [
        to.animate([{ transform: fromTransform }, { transform: "none" }], {
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }),
      ];
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, [copyPinned]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    page.style.setProperty("--headline-enter", `${resolvedTiming.enter}ms`);
    page.style.setProperty("--headline-leave", `${resolvedTiming.leave}ms`);
    page.style.setProperty("--dot-cycle", `${resolvedTiming.dotCycle}ms`);
    page.style.setProperty("--dot-stagger", `${resolvedTiming.dotStagger}ms`);
    page.style.setProperty("--dot-wave", `${resolvedTiming.dotCycle + resolvedTiming.dotStagger * 2}ms`);
    page.style.setProperty("--copied-spin", `${COPIED_HOLD_MS + BANNER_EXIT_MS}ms`);
  }, [resolvedTiming]);

  useEffect(() => {
    let cancelled = false;
    const timers = new Set<number>();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const later = (delay: number, run: () => void) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!cancelled) run();
      }, delay);
      timers.add(id);
    };

    let settleToken = 0;
    let dotsRested = Promise.resolve();

    const msUntilDotRest = (stopBy: number) => {
      const wave = timingRef.current.dotCycle + timingRef.current.dotStagger * 2;
      const settleAt = (timingRef.current.dotCycle / wave) * 0.8;
      const firstRest = timingRef.current.dotStagger * 2 + settleAt * wave;
      if (stopBy <= firstRest) return firstRest;
      const finishedCycles = Math.floor((stopBy - firstRest) / wave);
      return firstRest + finishedCycles * wave;
    };

    const startTyping = (stopBy: number) => {
      const token = ++settleToken;
      setTyping(true);
      const stopAt = msUntilDotRest(stopBy);
      dotsRested = new Promise((resolve) => {
        later(stopAt, () => {
          if (token !== settleToken) {
            resolve();
            return;
          }
          setTyping(false);
          resolve();
        });
      });
    };

    const cutTyping = () => {
      settleToken += 1;
      setTyping(false);
    };

    const showAfterTyping = (run: () => void) => {
      const token = settleToken;
      void dotsRested.then(() => {
        if (cancelled || token !== settleToken) return;
        run();
      });
    };

    const runTypingIntoHeadline = (stopBy: number, leaveMs: number, reveal: () => void) => {
      const stopAt = msUntilDotRest(stopBy);
      if (leaveMs > 0) later(Math.max(0, stopAt - leaveMs), () => setHeadlinePhase("leaving"));
      startTyping(stopBy);
      showAfterTyping(reveal);
    };

    const advance = (alreadyElapsed: number) => {
      setHeadlineIndex((index) => ((index ?? -1) + 1) % HEADLINES.length);
      setHeadlinePhase("shown");
      pause(alreadyElapsed);
    };

    const pause = (alreadyElapsed: number) => {
      const started = performance.now();
      const wait = () => {
        later(80, () => {
          const current = timingRef.current;
          const elapsed = performance.now() - started;
          if (elapsed < current.hold + alreadyElapsed) {
            wait();
            return;
          }
          if (reduceMotion) {
            cutTyping();
            advance(0);
            return;
          }
          runTypingIntoHeadline(current.lead + current.leave, current.leave, () => advance(timingRef.current.enter));
        });
      };
      wait();
    };

    if (cycle === 0) {
      if (reduceMotion) {
        cutTyping();
        setHeadlineIndex(0);
        setHeadlinePhase("shown");
        pause(0);
      } else {
        runTypingIntoHeadline(timingRef.current.lead / 2, 0, () => {
          setHeadlineIndex(0);
          setHeadlinePhase("shown");
          pause(timingRef.current.enter);
        });
      }
    } else {
      setHeadlineIndex((index) => index ?? 0);
      setHeadlinePhase("shown");
      cutTyping();
      later(40, () => {
        if (reduceMotion) {
          advance(0);
          return;
        }
        runTypingIntoHeadline(timingRef.current.lead + timingRef.current.leave, timingRef.current.leave, () =>
          advance(timingRef.current.enter),
        );
      });
    }

    return () => {
      cancelled = true;
      settleToken += 1;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [cycle]);

  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function updateTiming(key: keyof Timing, value: number) {
    setTiming((current) => ({ ...current, [key]: value }));
  }

  const dotWave = resolvedTiming.dotCycle + resolvedTiming.dotStagger * 2;
  const dotPulse = resolvedTiming.dotCycle / dotWave;
  const dotPeak = (dotPulse * 40).toFixed(2);
  const dotSettle = (dotPulse * 80).toFixed(2);

  return (
    <div ref={pageRef} className={["page", copied ? "is-copied" : "", ringing ? "is-ringing" : ""].filter(Boolean).join(" ")}>
      <style>{`
        @keyframes typing-dot {
          0%, ${dotSettle}%, 100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          ${dotPeak}% {
            opacity: 1;
            transform: translateY(-1.5px);
          }
        }
      `}</style>
      <div className={copyPinned ? "scroll-nav is-visible" : "scroll-nav"} aria-hidden={!copyPinned} inert={!copyPinned}>
        <div className="shell scroll-nav-inner">
          <button className="scroll-avatar" type="button" aria-label="Back to top" onClick={scrollToTop}>
            <Image src="/portrait.jpg" alt="" width={32} height={32} />
          </button>
          <button className="pill copy copy-wide" type="button" onClick={copyFile}>
            <CopyControl copied={copied} />
          </button>
        </div>
      </div>

      <SiteHeader copied={copied} copyError={copyError} showNote={showNote} onCopy={copyFile} />

      <section className="hero-band">
        <div className="shell hero">
          <h1 aria-hidden={headlineIndex === null}>
            {HEADLINES.map((headline, index) => {
              const isCurrent = index === headlineIndex;
              const className = !isCurrent ? "headline" : headlinePhase === "leaving" ? "headline is-leaving" : "headline is-active";

              return (
                <span key={index} className={className} aria-hidden={!isCurrent}>
                  {headline}
                </span>
              );
            })}
          </h1>
          <div className={typing ? "avatar is-typing" : "avatar"}>
            <span className="avatar-ring" aria-hidden="true" />
            <Image
              src="/portrait.jpg"
              alt="Jamie Sunderland"
              width={88}
              height={88}
              priority
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <span className={typing ? "avatar-badge is-typing" : "avatar-badge"} aria-hidden="true">
              <DotsIcon />
            </span>
          </div>
        </div>
      </section>

      <div className="copy-bar" ref={copyBarRef}>
        <div className="shell">
          <button className="pill copy copy-wide" type="button" onClick={copyFile}>
            <CopyControl copied={copied} />
          </button>
        </div>
      </div>

      <div
        className={["toast mobile-toast", showNote ? "is-visible" : "", copyPinned ? "is-pinned" : ""].filter(Boolean).join(" ")}
        role="status"
        aria-hidden={!showNote}
      >
        <span className="toast-line" />
        <p>
          {copyError
            ? "Couldn't copy from this browser."
            : "Paste in ChatGPT, Claude or any IDE to get started"}
        </p>
        <span className="toast-line" />
      </div>

      <section className="markdown" aria-label="Markdown file">
        <div className="shell lines">
          {lines.map((line, index) => (
            <div className="line" key={index}>
              <span className="num">{index + 1}</span>
              <span className="code">{line || " "}</span>
            </div>
          ))}
        </div>
      </section>
      {showTimingTuner ? (
        <TimingTuner
          timing={resolvedTiming}
          onChange={updateTiming}
          onPlay={() => setCycle((current) => current + 1)}
          onReset={() => {
            setTiming(DEFAULT_TIMING);
            setCycle((current) => current + 1);
          }}
        />
      ) : null}
    </div>
  );
}

const TUNER_FIELDS: { key: keyof Timing; label: string; min: number; max: number; step: number }[] = [
  { key: "hold", label: "Hold", min: 800, max: 8000, step: 100 },
  { key: "lead", label: "Loading", min: 0, max: 3000, step: 50 },
  { key: "leave", label: "Leave", min: 200, max: 2000, step: 50 },
  { key: "enter", label: "Arrive", min: 200, max: 2500, step: 50 },
  { key: "dotCycle", label: "Dot speed", min: 400, max: 1600, step: 50 },
  { key: "dotStagger", label: "Dot gap", min: 0, max: 400, step: 10 },
];

function TimingTuner({
  timing,
  onChange,
  onPlay,
  onReset,
}: {
  timing: Timing;
  onChange: (key: keyof Timing, value: number) => void;
  onPlay: () => void;
  onReset: () => void;
}) {
  return (
    <aside className="tuner" aria-label="Animation timing">
      <div className="tuner-head">
        <p className="tuner-title">Timing</p>
        <p className="tuner-note">Local only</p>
      </div>
      {TUNER_FIELDS.map((field) => (
        <label className="tuner-row" key={field.key}>
          <span>{field.label}</span>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={timing[field.key] ?? DEFAULT_TIMING[field.key]}
            onChange={(event) => onChange(field.key, Number(event.target.value))}
          />
          <output>{((timing[field.key] ?? DEFAULT_TIMING[field.key]) / 1000).toFixed(2)}s</output>
        </label>
      ))}
      <div className="tuner-actions">
        <button className="pill" type="button" onClick={onPlay}>
          Play now
        </button>
        <button className="pill" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}
