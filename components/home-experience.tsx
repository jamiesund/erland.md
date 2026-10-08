"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { AvatarField, AvatarResidue, releaseOneAvatar, useAvatarResidue } from "@/components/avatar-cascade";
import { NestEgg, useNestHold } from "@/components/nest-egg";
import { ArrowUpIcon, ChevronIcon, DotsIcon, LinkedInIcon, XIcon } from "@/components/icons";
import { socialLinks } from "@/lib/links";
import { MarkdownSelectionMenu } from "@/components/selection-menu";
import { VersionButton, VersionLogProvider } from "@/components/brand";
import { CopyControl, SiteHeader, useMarkdownCopy, COPIED_HOLD_MS, BANNER_EXIT_MS } from "@/components/site-header";

const MOBILE_LINE_CAP = 49;
const DESKTOP_LINE_CAP = 99;

function subscribeMobileLayout(onStoreChange: () => void) {
  const media = window.matchMedia("(max-width: 800px)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMobileLayoutSnapshot() {
  return window.matchMedia("(max-width: 800px)").matches;
}
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
  const [headlineIndex, setHeadlineIndex] = useState<number | null>(0);
  const [headlinePhase, setHeadlinePhase] = useState<"shown" | "leaving">("shown");
  const [typing, setTyping] = useState(false);
  const [firstEnter, setFirstEnter] = useState(false);
  const [timing, setTiming] = useState<Timing>(DEFAULT_TIMING);
  const resolvedTiming = useMemo(() => resolveTiming(timing), [timing]);
  const [cycle, setCycle] = useState(0);
  const timingRef = useRef(timing);
  const pageRef = useRef<HTMLDivElement>(null);
  const { copied, ringing, copyError, copyFile, confirmCopy, showNote } = useMarkdownCopy(markdown, pageRef);
  const copyBarRef = useRef<HTMLDivElement>(null);
  const pageEndRef = useRef<HTMLDivElement>(null);
  const floatBarRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const [copyPinned, setCopyPinned] = useState(false);
  const [headerPinned, setHeaderPinned] = useState(false);
  const residue = useAvatarResidue();
  const nest = useNestHold();
  const lines = markdown.replace(/\n$/, "").split("\n");
  const [showAll, setShowAll] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobileLayout, getMobileLayoutSnapshot, () => false);
  const canExpand = lines.length > MOBILE_LINE_CAP;
  const headLines = lines.slice(0, MOBILE_LINE_CAP);
  const midLines = lines.slice(MOBILE_LINE_CAP, DESKTOP_LINE_CAP);
  const restLines = lines.slice(DESKTOP_LINE_CAP);
  timingRef.current = resolvedTiming;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFirstEnter(true);
      return;
    }
    const frame = requestAnimationFrame(() => setFirstEnter(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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
      setHeaderPinned((pinned) => {
        if (!hidden) return false;
        const y = window.scrollY;
        return pinned ? y > 8 : y > 56;
      });
    };
    const dockFloatBar = () => {
      const page = pageRef.current;
      const row = pageEndRef.current;
      const bar = floatBarRef.current;
      if (!page || !row || !bar) return;
      if (residue.length === 0 || window.matchMedia("(max-width: 800px)").matches) {
        bar.classList.remove("is-docked");
        bar.style.top = "";
        delete bar.dataset.gap;
        return;
      }

      const rowStyle = getComputedStyle(row);
      const padTop = Number.parseFloat(rowStyle.paddingTop) || 0;
      const padBottom = Number.parseFloat(rowStyle.paddingBottom) || 0;
      const rowBox = row.getBoundingClientRect();
      const contentHeight = rowBox.height - padTop - padBottom;
      const line = rowBox.top + padTop + (contentHeight - bar.offsetHeight) / 2;

      let gap = Number.parseFloat(bar.dataset.gap || "");
      if (!Number.isFinite(gap)) {
        const docked = bar.classList.contains("is-docked");
        const parkedTop = bar.style.top;
        if (docked) {
          bar.classList.remove("is-docked");
          bar.style.top = "";
        }
        gap = window.innerHeight - bar.getBoundingClientRect().bottom;
        bar.dataset.gap = String(gap);
        if (docked) {
          bar.classList.add("is-docked");
          bar.style.top = parkedTop;
        }
      }

      const fixedTop = window.innerHeight - gap - bar.offsetHeight;
      if (line >= fixedTop - 0.5) {
        bar.classList.remove("is-docked");
        bar.style.top = "";
        return;
      }

      bar.classList.add("is-docked");
      bar.style.top = `${line - page.getBoundingClientRect().top}px`;
    };
    const onResize = () => {
      syncWidth();
      floatBarRef.current?.removeAttribute("data-gap");
      update();
      dockFloatBar();
    };
    syncWidth();
    update();
    dockFloatBar();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scroll", dockFloatBar, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("scroll", dockFloatBar);
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--page-width");
    };
  }, [residue.length, showAll]);

  useLayoutEffect(() => {
    if (!copyPinned) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const moves: [string, string, boolean][] = [
      [".top .version", ".scroll-nav .version", true],
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

  useLayoutEffect(() => {
    if (!(copyPinned || headerPinned)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const from = document.querySelector<HTMLElement>(".hero .avatar");
    const to = document.querySelector<HTMLElement>(".float-avatar");
    if (!from || !to) return;

    to.style.transform = "translateY(0)";
    const start = from.getBoundingClientRect();
    const end = to.getBoundingClientRect();
    to.style.transform = "";
    if (start.width === 0 || end.width === 0) return;

    const dx = start.left + start.width / 2 - (end.left + end.width / 2);
    const dy = start.top + start.height / 2 - (end.top + end.height / 2);
    const scale = start.width / end.width;
    const animation = to.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          opacity: 1,
          easing: "cubic-bezier(0.45, 0, 0.8, 1)",
        },
        { transform: "translate(0px, 18px) scale(0.8)", opacity: 1, offset: 0.52, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        { transform: "translate(0px, -16px) scale(1.18)", opacity: 1, offset: 0.7, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
        { transform: "translate(0px, 5px) scale(0.94)", opacity: 1, offset: 0.86 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 880 },
    );

    return () => animation.cancel();
  }, [copyPinned, headerPinned]);

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
      cutTyping();
      setHeadlineIndex(0);
      setHeadlinePhase("shown");
      pause(reduceMotion ? 0 : timingRef.current.enter);
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

  const avatarDrag = useRef<{ id: number; x: number; y: number; dragged: boolean } | null>(null);

  function avatarPress(node: HTMLElement) {
    return node.querySelector<HTMLElement>(".avatar-press") ?? node;
  }

  function cancelAvatarMotion(node: HTMLElement) {
    const targets = new Set<HTMLElement>([node, avatarPress(node)]);
    for (const target of targets) {
      target.getAnimations().forEach((animation) => {
        if (animation instanceof CSSAnimation) return;
        animation.cancel();
      });
    }
  }

  function playAvatarBounce(node: HTMLElement) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAvatarMotion(node);
    avatarPress(node).animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.95)", offset: 0.34 },
        { transform: "scale(1.028)", offset: 0.62 },
        { transform: "scale(1)" },
      ],
      { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }

  function onAvatarPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    nest.onPointerDown(event);
    const node = event.currentTarget;
    try {
      node.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can already be gone if the gesture ends immediately.
    }
    avatarDrag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
    playAvatarBounce(node);
  }

  function onAvatarPointerMove(event: PointerEvent<HTMLElement>) {
    const drag = avatarDrag.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const node = event.currentTarget;
    if (!drag.dragged) {
      if (dx * dx + dy * dy < 64) return;
      drag.dragged = true;
      nest.onPointerUp();
      cancelAvatarMotion(node);
      node.style.zIndex = "9";
      releaseOneAvatar(node.getBoundingClientRect());
    }
    node.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function onAvatarPointerUp(event: PointerEvent<HTMLElement>) {
    const drag = avatarDrag.current;
    if (!drag || drag.id !== event.pointerId) return;
    const node = event.currentTarget;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    avatarDrag.current = null;
    nest.onPointerUp();
    if (nest.consume()) {
      node.style.transform = "";
      node.style.zIndex = "";
      return;
    }
    if (!drag.dragged) {
      releaseOneAvatar(node.getBoundingClientRect());
      return;
    }
    node.style.transform = "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.zIndex = "";
      return;
    }
    const animation = node.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0px, 0px)" }],
      { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    const clearLayer = () => {
      node.style.zIndex = "";
    };
    animation.onfinish = clearLayer;
    animation.oncancel = clearLayer;
  }

  function updateTiming(key: keyof Timing, value: number) {
    setTiming((current) => ({ ...current, [key]: value }));
  }

  const dotWave = resolvedTiming.dotCycle + resolvedTiming.dotStagger * 2;
  const dotPulse = resolvedTiming.dotCycle / dotWave;
  const dotPeak = (dotPulse * 40).toFixed(2);
  const dotSettle = (dotPulse * 80).toFixed(2);

  return (
    <VersionLogProvider>
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
          <VersionButton />
          <button className="pill copy copy-wide" type="button" onClick={copyFile}>
            <CopyControl copied={copied} />
          </button>
        </div>
      </div>

      <SiteHeader copied={copied} copyError={copyError} showNote={showNote} onCopy={copyFile} />

      <div className="intro">
      <section className="hero-band">
        <div className="shell hero">
          <h1 aria-hidden={headlineIndex === null}>
            {HEADLINES.map((headline, index) => {
              const isCurrent = index === headlineIndex;
              const className = !isCurrent
                ? "headline"
                : headlinePhase === "leaving"
                  ? "headline is-leaving"
                  : index === 0 && !firstEnter
                    ? "headline"
                    : "headline is-active";

              return (
                <span key={index} className={className} aria-hidden={!isCurrent}>
                  {headline}
                </span>
              );
            })}
          </h1>
          <div
            className={typing ? "avatar is-typing" : "avatar"}
            role="button"
            tabIndex={0}
            aria-label="Jamie Sunderland"
            onPointerDown={onAvatarPointerDown}
            onPointerMove={onAvatarPointerMove}
            onPointerUp={onAvatarPointerUp}
            onPointerCancel={onAvatarPointerUp}
            onDragStart={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              releaseOneAvatar(event.currentTarget.getBoundingClientRect());
              playAvatarBounce(event.currentTarget);
            }}
          >
            <span className="avatar-photo">
              <span className="avatar-press">
                <span className="avatar-ring" aria-hidden="true" />
                <Image
                  src="/portrait.jpg"
                  alt=""
                  width={88}
                  height={88}
                  priority
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </span>
            </span>
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
      </div>

      <div
        className={["toast mobile-toast", showNote ? "is-visible" : "", copyPinned ? "is-pinned" : ""].filter(Boolean).join(" ")}
        role="status"
        aria-hidden={!showNote}
      >
        <span className="toast-line" />
        <p>
          {copyError ? (
            "Couldn't copy from this browser."
          ) : (
            <>
              Paste in ChatGPT, Claude
              <br />
              or where you chat with AI
            </>
          )}
        </p>
        <span className="toast-line" />
      </div>

      <section className="markdown" aria-label="Markdown file">
        <div className={showAll ? "shell lines is-expanded" : "shell lines"} ref={linesRef}>
          {headLines.map((line, index) => (
            <div className="line" key={index}>
              <span className="num">{index + 1}</span>
              <span className="code">{line || " "}</span>
            </div>
          ))}
          {midLines.length > 0 ? (
            <div className="lines-mid">
              <div className="lines-mid-grid">
                <div className="lines-mid-clip" aria-hidden={!showAll && isMobile}>
                  {midLines.map((line, index) => (
                    <div className="line" key={MOBILE_LINE_CAP + index}>
                      <span className="num">{MOBILE_LINE_CAP + 1 + index}</span>
                      <span className="code">{line || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {restLines.length > 0 ? (
            <div className={showAll ? "line-rest is-open" : "line-rest"}>
              <div className="line-rest-grid">
                <div className="line-rest-clip" aria-hidden={!showAll}>
                  {restLines.map((line, index) => (
                    <div className="line" key={DESKTOP_LINE_CAP + index}>
                      <span className="num">{DESKTOP_LINE_CAP + 1 + index}</span>
                      <span className="code">{line || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {canExpand ? (
            <button
              className={showAll ? "pill log-feedback show-all is-open" : "pill log-feedback show-all"}
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((open) => !open)}
            >
              {showAll ? "Show less" : "Show all"}
              <ChevronIcon />
            </button>
          ) : null}
          {canExpand ? <hr className="log-rule file-rule" /> : null}
        </div>
      </section>
      <div className={residue.length === 0 ? "shell page-end is-flush" : "shell page-end"} ref={pageEndRef}>
        <Link className="pill log-feedback" href="/feedback" scroll={false}>
          Give feedback
          <ChevronIcon />
        </Link>
        <div className="feedback-connect">
          <h3>More on</h3>
          <a className="pill tool" href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <LinkedInIcon className="linkedin-icon" />
          </a>
          <a className="pill tool" href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X">
            <XIcon />
          </a>
        </div>
      </div>
      <AvatarResidue />
      <MarkdownSelectionMenu containerRef={linesRef} onCopied={confirmCopy} />
      <div className="float-bar" ref={floatBarRef}>
      <button
        className={copyPinned || headerPinned ? "back-top is-visible" : "back-top"}
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!(copyPinned || headerPinned)}
        inert={!(copyPinned || headerPinned)}
      >
        <ArrowUpIcon className="back-top-icon" />
        <span className="back-top-label">Back to top</span>
      </button>
      <button
        className={copyPinned || headerPinned ? "pill copy copy-wide mobile-nav-copy is-visible" : "pill copy copy-wide mobile-nav-copy"}
        type="button"
        onClick={copyFile}
        aria-hidden={!(copyPinned || headerPinned)}
        inert={!(copyPinned || headerPinned)}
      >
        <CopyControl copied={copied} />
      </button>
      <button
        className={copyPinned || headerPinned ? "float-avatar is-visible" : "float-avatar"}
        type="button"
        aria-label="Jamie Sunderland"
        aria-hidden={!(copyPinned || headerPinned)}
        inert={!(copyPinned || headerPinned)}
        onPointerDown={onAvatarPointerDown}
        onPointerMove={onAvatarPointerMove}
        onPointerUp={onAvatarPointerUp}
        onPointerCancel={onAvatarPointerUp}
        onDragStart={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          releaseOneAvatar(event.currentTarget.getBoundingClientRect());
          playAvatarBounce(event.currentTarget);
        }}
      >
        <span className="avatar-press">
          <span className="avatar-ring" aria-hidden="true" />
          <Image src="/portrait.jpg" alt="" width={48} height={48} draggable={false} />
        </span>
      </button>
      </div>
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
      <AvatarField />
      <NestEgg />
    </div>
    </VersionLogProvider>
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
