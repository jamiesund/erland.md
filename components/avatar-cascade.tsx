"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

const COUNT = 46;
const GRAVITY = 760;
const WALL = 0.9;
const EASE = 1.2;

const SHRINK = 0.92;
const LEAVE = 480;

type Face = {
  el: HTMLImageElement;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  delay: number;
  bornAt: number;
  ease: number;
  shrink: number;
  hops: number;
  limit: number;
  leavingAt: number;
  dead: boolean;
};

type Group = {
  root: HTMLElement;
  faces: Face[];
  started: number;
};

const groups: Group[] = [];
let frame = 0;
let last = 0;
let pageRoot: HTMLElement | null = null;

type ResidueFace = {
  id: number;
  size: number;
  left: number;
  bottom: number;
  rot: number;
  delay: number;
  layer: number;
  leaving: boolean;
};

const RESIDUE_MAX = 20;
const EMPTY_RESIDUE: ResidueFace[] = [];
let residueSnapshot: ResidueFace[] = EMPTY_RESIDUE;
let residueId = 0;
const residueListeners = new Set<() => void>();

function subscribeResidue(listener: () => void) {
  residueListeners.add(listener);
  return () => residueListeners.delete(listener);
}

function emitResidue() {
  residueListeners.forEach((listener) => listener());
}

function pushResidue(count: number) {
  if (count <= 0 || residueSnapshot.length >= RESIDUE_MAX) return;
  const adding = Math.min(count, RESIDUE_MAX - residueSnapshot.length);
  const next: ResidueFace[] = [];
  const height = 180;
  for (let index = 0; index < adding; index += 1) {
    residueId += 1;
    const size = 32 + Math.round(Math.random() * 52);
    const room = Math.max(0, height - size - 20);
    next.push({
      id: residueId,
      size,
      left: Math.round((10 + Math.random() * 80) * 10) / 10,
      bottom: 10 + Math.round(Math.random() * room),
      rot: Math.round((Math.random() - 0.5) * 28),
      delay: Math.round(Math.random() * 220),
      layer: 1 + Math.floor(Math.random() * 5),
      leaving: false,
    });
  }
  residueSnapshot = residueSnapshot.concat(next);
  emitResidue();
}

function dismissResidue(id: number) {
  const face = residueSnapshot.find((item) => item.id === id);
  if (!face || face.leaving) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    residueSnapshot = residueSnapshot.filter((item) => item.id !== id);
    emitResidue();
    return;
  }
  residueSnapshot = residueSnapshot.map((item) => (item.id === id ? { ...item, leaving: true } : item));
  emitResidue();
}

function removeResidue(id: number) {
  if (!residueSnapshot.some((item) => item.id === id)) return;
  residueSnapshot = residueSnapshot.filter((item) => item.id !== id);
  emitResidue();
}

export function noteAvatarResidue(source: "click" | "email") {
  if (source === "email") {
    pushResidue(4 + Math.floor(Math.random() * 13));
    return;
  }
  pushResidue(1);
}

export function useAvatarResidue() {
  return useSyncExternalStore(subscribeResidue, () => residueSnapshot, () => EMPTY_RESIDUE);
}

export function AvatarResidue() {
  const faces = useAvatarResidue();
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [faces.length, visible]);

  if (faces.length === 0) return null;

  return (
    <div ref={rootRef} className={visible ? "avatar-residue is-visible" : "avatar-residue"} aria-hidden="true">
      {faces.map((face) => (
        <img
          key={face.id}
          className={face.leaving ? "avatar-residue-face is-leaving" : "avatar-residue-face"}
          src="/portrait.jpg"
          alt=""
          width={face.size}
          height={face.size}
          draggable={false}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            dismissResidue(face.id);
          }}
          onAnimationEnd={(event) => {
            if (event.animationName !== "residue-out") return;
            removeResidue(face.id);
          }}
          style={
            {
              width: face.size,
              height: face.size,
              left: `${face.left}%`,
              bottom: face.bottom,
              zIndex: face.layer,
              animationDelay: face.leaving ? "0ms" : `${face.delay}ms`,
              "--residue-rot": `${face.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function ensureLoop() {
  if (frame) return;
  last = performance.now();
  frame = window.requestAnimationFrame(tick);
}

function tick(now: number) {
  const dt = Math.min(0.032, (now - last) / 1000);
  last = now;

  for (const group of groups) {
    const width = group.root.clientWidth;
    const height = group.root.clientHeight;
    const elapsed = now - group.started;

    for (const face of group.faces) {
      if (face.dead || elapsed < face.delay) continue;
      if (face.bornAt === 0) face.bornAt = now;

      const gain = smooth((now - face.bornAt) / (face.ease * 1000));
      if (face.leavingAt) {
        const t = 1 - (1 - Math.min(1, (now - face.leavingAt) / LEAVE)) ** 3;
        const scale = face.shrink * (1 - t);
        face.el.style.opacity = String(1 - t);
        face.el.style.transform = `translate3d(${face.x}px, ${face.y}px, 0) rotate(${face.rot}deg) scale(${scale})`;
        if (t >= 1) {
          face.dead = true;
          face.el.remove();
        }
        continue;
      }

      face.vy += GRAVITY * dt * gain;
      face.x += face.vx * dt * gain;
      face.y += face.vy * dt * gain;
      face.rot += face.vr * dt * gain;

      const shown = face.shrink * (face.ease < 0.5 ? 0.96 + 0.04 * gain : 0.9 + 0.1 * gain);
      const drawn = face.size * shown;

      if (face.y + (face.size + drawn) / 2 > height) {
        face.y -= face.y + (face.size + drawn) / 2 - height;
        face.hops += 1;
        face.shrink *= SHRINK;
        if (face.hops >= face.limit) {
          face.leavingAt = now;
          continue;
        }
        const lift = height * 0.34 * 0.58 ** (face.hops - 1);
        face.vy = -Math.sqrt(2 * GRAVITY * Math.max(lift, 36));
        face.vx += (Math.random() - 0.5) * 24;
        face.vr *= 0.96;
      }
      if (face.y + (face.size - drawn) / 2 < 0 && face.vy < 0) {
        face.y -= face.y + (face.size - drawn) / 2;
        face.vy *= -WALL;
      }
      if (face.x + (face.size - drawn) / 2 < 0) {
        face.x -= face.x + (face.size - drawn) / 2;
        face.vx = Math.abs(face.vx) * WALL;
      } else if (face.x + (face.size + drawn) / 2 > width) {
        face.x -= face.x + (face.size + drawn) / 2 - width;
        face.vx = -Math.abs(face.vx) * WALL;
      }
      const scale = face.shrink * (face.ease < 0.5 ? 0.96 + 0.04 * gain : 0.9 + 0.1 * gain);
      face.el.style.opacity = String(gain);
      face.el.style.transform = `translate3d(${face.x}px, ${face.y}px, 0) rotate(${face.rot}deg) scale(${scale})`;
      face.el.style.pointerEvents = overlapsHeader(face, drawn) ? "none" : "auto";
    }

    group.faces = group.faces.filter((face) => !face.dead);
  }

  frame = groups.some((group) => group.faces.length > 0) ? window.requestAnimationFrame(tick) : 0;
}

function overlapsHeader(face: Face, drawn: number) {
  const left = face.x + (face.size - drawn) / 2;
  const top = face.y + (face.size - drawn) / 2;
  const right = left + drawn;
  const bottom = top + drawn;
  const zones = document.querySelectorAll(".top, .scroll-nav, .hero .avatar, .float-avatar.is-visible");
  for (const zone of zones) {
    const box = zone.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    if (left < box.right && right > box.left && top < box.bottom && bottom > box.top) return true;
  }
  return false;
}

function releaseFaces(root: HTMLElement, count: number, originX: number, originY: number, size?: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let group = groups.find((item) => item.root === root);
  if (!group) {
    group = { root, faces: [], started: performance.now() };
    groups.push(group);
  }

  for (let index = 0; index < count; index += 1) {
    const el = document.createElement("img");
    const faceSize = size ?? 48 + (index % 5) * 10;
    el.src = "/portrait.jpg";
    el.alt = "";
    el.className = "cascade-face";
    el.width = Math.round(faceSize);
    el.height = Math.round(faceSize);
    root.appendChild(el);
    const shot = count === 1;
    const fan = shot ? (Math.random() < 0.5 ? -1 : 1) : (index / count) * 2 - 1;
    const face: Face = {
      el,
      size: faceSize,
      x: originX - faceSize / 2,
      y: originY - faceSize / 2,
      vx: fan * (shot ? 120 + Math.random() * 60 : 90 + Math.random() * 60),
      vy: shot ? -110 - Math.random() * 50 : -70 - Math.random() * 80,
      rot: (Math.random() - 0.5) * 10,
      vr: (Math.random() - 0.5) * (shot ? 42 : 36),
      delay: shot ? 0 : index * 96,
      bornAt: 0,
      ease: shot ? 0.48 : EASE,
      shrink: 1,
      hops: 0,
      limit: 5 + Math.floor(Math.random() * 2),
      leavingAt: 0,
      dead: false,
    };
    el.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (face.leavingAt) return;
      face.leavingAt = performance.now();
    });
    group.faces.push(face);
  }

  ensureLoop();
}

export function releaseOneAvatar(rect: DOMRect) {
  if (!pageRoot) return;
  noteAvatarResidue("click");
  const size = Math.max(rect.width, 88) * 1.35;
  releaseFaces(pageRoot, 1, rect.left + rect.width / 2, rect.top + rect.height / 2, size);
}

export function AvatarField() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pageRoot = rootRef.current;
    return () => {
      if (pageRoot === rootRef.current) pageRoot = null;
      const group = groups.find((item) => item.root === rootRef.current);
      if (!group) return;
      group.faces.forEach((face) => face.el.remove());
      groups.splice(groups.indexOf(group), 1);
    };
  }, []);

  return <div ref={rootRef} className="avatar-field" aria-hidden="true" />;
}

function portraitCenter(selector: string) {
  const avatar = document.querySelector(selector);
  if (!avatar) return null;
  const box = avatar.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const shown = box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth;
  return { x: box.left + box.width / 2, y: box.top + box.height / 2, shown };
}

export function AvatarCascade() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const hero = portraitCenter(".hero .avatar");
    const docked = portraitCenter(".float-avatar.is-visible");
    const origin = hero?.shown ? hero : (docked ?? hero);
    const rootBox = root.getBoundingClientRect();
    const originX = (origin?.x ?? window.innerWidth * 0.72) - rootBox.left;
    const originY = (origin?.y ?? 96) - rootBox.top;
    releaseFaces(root, COUNT, originX, originY);
    return () => {
      const group = groups.find((item) => item.root === root);
      if (!group) return;
      group.faces.forEach((face) => face.el.remove());
      groups.splice(groups.indexOf(group), 1);
    };
  }, []);

  return <div ref={rootRef} className="avatar-cascade" aria-hidden="true" />;
}
