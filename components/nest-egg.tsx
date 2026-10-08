"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { lockPageScroll, unlockPageScroll } from "@/lib/scroll-lock";

const ROUND_MS = 60_000;
const HOLD_MS = 740;
const POP_MS = 480;
const RING_C = 2 * Math.PI * 18;

const POINT_COLOR: Record<number, string> = {
  1: "color-mix(in srgb, #e0b15a 46%, #151515)",
  2: "color-mix(in srgb, #e0b15a 72%, #151515)",
  3: "#e0b15a",
  5: "#e6ac00",
};
const NEGATIVE_COLOR = "#c45454";

const BEST_KEY = "nest-egg-best";

function readBest(): number | null {
  try {
    const stored = window.localStorage.getItem(BEST_KEY);
    if (stored != null && stored !== "") {
      const value = Number(stored);
      if (Number.isFinite(value)) return value;
    }
    const raw = JSON.parse(window.localStorage.getItem("nest-egg-board") || "null");
    if (!Array.isArray(raw)) return null;
    const scores = raw.flatMap((entry) =>
      entry && typeof entry.score === "number" && Number.isFinite(entry.score) ? [entry.score] : [],
    );
    return scores.length > 0 ? Math.max(...scores) : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();

export function requestNestEgg() {
  listeners.forEach((listener) => listener());
}

export function useNestHold() {
  const timer = useRef<number | null>(null);
  const held = useRef(false);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    held.current = false;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      held.current = true;
      requestNestEgg();
    }, HOLD_MS);
  }

  function onPointerUp() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }

  function consume() {
    const did = held.current;
    held.current = false;
    return did;
  }

  return { onPointerDown, onPointerUp, consume };
}

type Balloon = {
  id: number;
  multiplier: number;
  x: number;
  size: number;
  duration: number;
  drift: number;
  rot: number;
  rest: number;
  born: number;
  popping: boolean;
  popUntil: number;
};

type Phase = "idle" | "count" | "play" | "score";

function rollMultiplier() {
  const roll = Math.random();
  if (roll > 0.97) return 5;
  if (roll > 0.93) return -2;
  if (roll > 0.86) return 3;
  if (roll > 0.78) return -1;
  if (roll > 0.62) return 2;
  return 1;
}

function sizeFor(multiplier: number) {
  const value = Math.abs(multiplier);
  if (value >= 5) return 44;
  if (value >= 3) return 60;
  if (value >= 2) return 78;
  return 100;
}

function pointColor(multiplier: number) {
  if (multiplier < 0) return NEGATIVE_COLOR;
  return POINT_COLOR[multiplier] ?? POINT_COLOR[1];
}

function pointInk(multiplier: number) {
  if (multiplier < 0 || multiplier === 1) return "#fff";
  return "#151515";
}

function pointLabel(multiplier: number) {
  if (multiplier > 1) return `+${multiplier}`;
  if (multiplier < 0) return `${multiplier}`;
  return "";
}

function makeBalloon(id: number, now: number, reduce: boolean, urgency: number): Balloon {
  const multiplier = rollMultiplier();
  const value = Math.abs(multiplier);
  const base = value >= 5 ? 2200 : value >= 3 ? 2800 : value >= 2 ? 3400 : 4200;
  const travel = reduce ? 2400 : base * (1 - 0.5 * urgency);
  return {
    id,
    multiplier,
    x: 16 + Math.random() * 68,
    size: sizeFor(multiplier),
    duration: Math.round(travel * (0.85 + Math.random() * 0.3)),
    drift: Math.round((Math.random() - 0.5) * 96),
    rot: Math.round((Math.random() - 0.5) * 16),
    rest: Math.round(24 + Math.random() * 46),
    born: now,
    popping: false,
    popUntil: 0,
  };
}

export function NestEgg() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [seconds, setSeconds] = useState(60);
  const [score, setScore] = useState(0);
  const [scoreColor, setScoreColor] = useState(POINT_COLOR[1]);
  const [scorePulse, setScorePulse] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [record, setRecord] = useState(false);
  const phaseRef = useRef<Phase>("idle");
  const balloonsRef = useRef<Balloon[]>([]);
  const scoreRef = useRef(0);
  const caughtRef = useRef(0);
  const missedRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const bestAtStart = useRef<number | null>(null);
  const idRef = useRef(0);
  phaseRef.current = phase;
  scoreRef.current = score;

  useEffect(() => {
    const open = () => {
      if (phaseRef.current !== "idle") return;
      scoreRef.current = 0;
      caughtRef.current = 0;
      missedRef.current = 0;
      balloonsRef.current = [];
      setScore(0);
      setScorePulse(0);
      setSeconds(60);
      setBalloons([]);
      setCount(3);
      setPhase("count");
    };
    listeners.add(open);

    let buffer = "";
    let reset = 0;
    const onKey = (event: KeyboardEvent) => {
      if (phaseRef.current !== "idle") return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length !== 1) return;
      const next = `${buffer}${event.key.toLowerCase()}`;
      buffer = "game".startsWith(next) ? next : event.key.toLowerCase() === "g" ? "g" : "";
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        buffer = "";
      }, 1100);
      if (buffer === "game") {
        buffer = "";
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      listeners.delete(open);
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(reset);
    };
  }, []);

  useLayoutEffect(() => {
    if (phase === "idle") return;
    lockPageScroll();
    rootRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      balloonsRef.current = [];
      setBalloons([]);
      setPhase("idle");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockPageScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [phase === "idle"]);

  useEffect(() => {
    if (phase !== "play") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    let nextSpawn = started + 240;
    let shownSecond = 60;
    let frame = 0;

    const tick = (now: number) => {
      const left = Math.max(0, (ROUND_MS - (now - started)) / 1000);
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String((1 - left / 60) * RING_C);
      const second = Math.ceil(left);
      if (second !== shownSecond) {
        shownSecond = second;
        setSeconds(second);
      }
      if (left <= 0) {
        balloonsRef.current = [];
        setBalloons([]);
        setPhase("score");
        return;
      }

      let list = balloonsRef.current.filter((balloon) => {
        if (balloon.popping) return now < balloon.popUntil;
        if (now - balloon.born < balloon.duration) return true;
        missedRef.current += 1;
        return false;
      });
      let changed = list.length !== balloonsRef.current.length;

      if (now >= nextSpawn) {
        const elapsed = (now - started) / 1000;
        const urgency = Math.min(elapsed / 60, 1);
        const resolved = caughtRef.current + missedRef.current;
        const hot = resolved >= 8 && caughtRef.current / resolved > 0.9;
        const pace = 900 - Math.min(elapsed / 60, 1) * 520;
        const cap = hot ? 18 : 12;
        nextSpawn = now + (hot ? pace * 0.45 : pace);
        if (list.length < cap) {
          const batch = hot ? 2 : 1;
          for (let index = 0; index < batch && list.length < cap; index += 1) {
            list = [...list, makeBalloon(++idRef.current, now, reduce, urgency)];
          }
          changed = true;
        } else {
          nextSpawn = now + 220;
        }
      }

      if (changed) {
        balloonsRef.current = list;
        setBalloons(list);
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== "count") return;
    if (ringRef.current) ringRef.current.style.strokeDashoffset = "0";
    let step = 3;
    const timer = window.setInterval(() => {
      step -= 1;
      if (step <= 0) {
        window.clearInterval(timer);
        setPhase("play");
        return;
      }
      setCount(step);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase === "count") bestAtStart.current = readBest();
    if (phase !== "score") return;
    const previous = bestAtStart.current;
    const current = scoreRef.current;
    const next = previous == null ? current : Math.max(previous, current);
    setBest(next);
    setRecord(previous == null || current > previous);
    try {
      window.localStorage.setItem(BEST_KEY, String(next));
    } catch {
      // Storage can be blocked. This round's score still shows.
    }
  }, [phase]);

  function playAgain() {
    scoreRef.current = 0;
    caughtRef.current = 0;
    missedRef.current = 0;
    balloonsRef.current = [];
    setScore(0);
    setScorePulse(0);
    setSeconds(60);
    setBalloons([]);
    setCount(3);
    setPhase("count");
  }

  function pop(id: number) {
    if (phaseRef.current !== "play") return;
    const balloon = balloonsRef.current.find((item) => item.id === id);
    if (!balloon || balloon.popping) return;
    setScoreColor(pointColor(balloon.multiplier));
    setScorePulse((count) => count + 1);
    caughtRef.current += 1;
    scoreRef.current += balloon.multiplier;
    setScore(scoreRef.current);
    const next = balloonsRef.current.map((item) =>
      item.id === id ? { ...item, popping: true, popUntil: performance.now() + POP_MS } : item,
    );
    balloonsRef.current = next;
    setBalloons(next);
  }

  function finishRound() {
    balloonsRef.current = [];
    setBalloons([]);
    setPhase("score");
  }

  function close() {
    balloonsRef.current = [];
    setBalloons([]);
    setPhase("idle");
  }

  if (phase === "idle") return null;

  return (
    <div
      ref={rootRef}
      className={phase === "play" ? "nest is-play" : "nest"}
      role="dialog"
      aria-modal="true"
      aria-label="Pop the portraits"
      tabIndex={-1}
    >
      <div className="shell nest-hud">
        {phase === "play" || phase === "count" ? (
          <button className="pill log-feedback" type="button" data-track="Exit game" onClick={finishRound}>
            Exit
          </button>
        ) : (
          <span />
        )}
        {phase === "play" || phase === "count" ? (
          <span className="nest-clock" aria-label={`${seconds} seconds left`}>
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle className="nest-clock-track" cx="22" cy="22" r="18" />
              <circle ref={ringRef} className="nest-clock-value" cx="22" cy="22" r="18" />
            </svg>
            <span className="nest-time">{seconds}</span>
          </span>
        ) : null}
        {phase === "play" || phase === "count" ? (
          <span
            key={scorePulse}
            className={[
              "nest-points",
              score < 0 ? "is-minus" : "",
              scorePulse > 0 ? "is-scoring" : "",
              scorePulse > 0 && scoreColor === NEGATIVE_COLOR ? "is-penalty" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--score-color": scoreColor } as CSSProperties}
          >
            {score}
          </span>
        ) : (
          <span />
        )}
      </div>

      {phase === "count" ? (
        <div className="nest-count" aria-live="assertive">
          <strong key={count}>{count}</strong>
        </div>
      ) : phase === "play" ? (
        <div className="nest-field">
          {balloons.map((balloon) => (
            <span
              key={balloon.id}
              className="nest-balloon"
              style={
                {
                  left: `${balloon.x}%`,
                  width: balloon.size,
                  height: balloon.size,
                  animationDuration: `${balloon.duration}ms`,
                  "--drift": `${balloon.drift}px`,
                  "--rot": `${balloon.rot}deg`,
                  "--rest": `${balloon.rest}%`,
                  "--point-color": pointColor(balloon.multiplier),
                  "--point-ink": pointInk(balloon.multiplier),
                } as CSSProperties
              }
            >
              <button
                className={balloon.popping ? "nest-balloon-face is-popping" : "nest-balloon-face"}
                type="button"
                aria-label={balloon.multiplier < 0 ? `Subtract ${-balloon.multiplier}` : `Add ${balloon.multiplier}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  pop(balloon.id);
                }}
              >
                <img src="/portrait.jpg" alt="" width={balloon.size} height={balloon.size} draggable={false} />
                {pointLabel(balloon.multiplier) ? <span className="nest-mult">{pointLabel(balloon.multiplier)}</span> : null}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className={record ? "nest-end is-champion" : "nest-end"}>
          <strong>{score}</strong>
          {best != null ? <p className="nest-best">{record ? "New best" : `Best ${best}`}</p> : null}
          <div className="nest-end-actions">
            <button className="pill done" type="button" data-track="Play again" onClick={playAgain}>
              Play again
            </button>
            <button className="pill log-feedback" type="button" data-track="Done · Game" onClick={close}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
