"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

type Anchor = {
  x: number;
  y: number;
  entire: boolean;
};

type Pin = {
  pageX: number;
  pageY: number;
  fromPointer: boolean;
};

const MENU_HEIGHT = 32;
const HEADER_CLEARANCE = 64;

function selectionInside(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  if (!selection.toString().trim()) return null;
  return range;
}

function caretPoint(range: Range) {
  const selection = window.getSelection();
  const caret = range.cloneRange();
  if (selection?.focusNode) {
    try {
      caret.setStart(selection.focusNode, selection.focusOffset);
      caret.collapse(true);
    } catch {
      caret.collapse(false);
    }
  } else {
    caret.collapse(false);
  }
  const rect = [...caret.getClientRects()].find((item) => item.height > 0) ?? null;
  if (rect) return { x: rect.left, y: rect.bottom };
  const rects = [...range.getClientRects()].filter((item) => item.width > 0 || item.height > 0);
  const last = rects[rects.length - 1];
  if (!last) return null;
  return { x: last.right, y: last.bottom };
}

function coversAll(root: HTMLElement, range: Range) {
  const full = document.createRange();
  full.selectNodeContents(root);
  const sameBounds =
    range.compareBoundaryPoints(Range.START_TO_START, full) === 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, full) === 0;
  if (sameBounds) return true;
  const selected = range.toString().trim();
  return selected.length > 0 && selected === full.toString().trim();
}

async function writeClipboard(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const legacy = document.execCommand("copy");
  area.remove();
  if (legacy) return true;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function MarkdownSelectionMenu({
  containerRef,
  onCopied,
}: {
  containerRef: RefObject<HTMLElement | null>;
  onCopied: (ok: boolean) => void;
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [dragging, setDragging] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const copying = useRef(false);
  const pendingText = useRef("");
  const draggingRef = useRef(false);
  const pinRef = useRef<Pin | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);

  useLayoutEffect(() => {
    const width = menuRef.current?.offsetWidth ?? 0;
    setMenuWidth((current) => (current === width ? current : width));
  }, [anchor]);

  useEffect(() => {
    const place = (x: number, y: number, entire: boolean) => {
      if (y < -MENU_HEIGHT || y > window.innerHeight + MENU_HEIGHT) {
        setAnchor((current) => (current === null ? current : null));
        return;
      }
      setAnchor((current) => {
        if (current && current.x === x && current.y === y && current.entire === entire) return current;
        return { x, y, entire };
      });
    };

    const publish = (range: Range, root: HTMLElement) => {
      const pin = pinRef.current;
      if (!pin) return;
      place(pin.pageX - window.scrollX, pin.pageY - window.scrollY, coversAll(root, range));
    };

    const pinAt = (x: number, y: number, fromPointer: boolean, range: Range, root: HTMLElement) => {
      pinRef.current = {
        pageX: x + window.scrollX,
        pageY: y + window.scrollY,
        fromPointer,
      };
      publish(range, root);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const root = containerRef.current;
      const target = event.target;
      if (!root || !(target instanceof Node) || !root.contains(target)) return;
      draggingRef.current = true;
      pinRef.current = null;
      setDragging(true);
      setAnchor(null);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        if (!draggingRef.current) return;
        const root = containerRef.current;
        const range = root ? selectionInside(root) : null;
        if (!root || !range) return;
        const { x, y } = pointerRef.current;
        pinRef.current = { pageX: x + window.scrollX, pageY: y + window.scrollY, fromPointer: true };
        place(x, y, false);
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      const root = containerRef.current;
      const range = root ? selectionInside(root) : null;
      if (!root || !range) {
        pinRef.current = null;
        setAnchor(null);
        return;
      }
      pinAt(event.clientX, event.clientY, true, range, root);
    };

    const onSelectionChange = () => {
      const root = containerRef.current;
      if (!root || draggingRef.current) return;
      const range = selectionInside(root);
      if (!range) {
        pinRef.current = null;
        setAnchor(null);
        return;
      }
      if (pinRef.current?.fromPointer) {
        publish(range, root);
        return;
      }
      const caret = caretPoint(range);
      if (!caret) {
        setAnchor(null);
        return;
      }
      pinAt(caret.x, caret.y, false, range, root);
    };

    const onScroll = () => {
      if (draggingRef.current) return;
      const root = containerRef.current;
      const range = root ? selectionInside(root) : null;
      if (!root || !range) return;
      publish(range, root);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [containerRef]);

  if (!anchor) return null;

  const above = anchor.y > HEADER_CLEARANCE + MENU_HEIGHT + 12;
  const half = menuWidth / 2;
  const left = Math.min(window.innerWidth - half - 8, Math.max(half + 8, anchor.x));

  async function onCopy() {
    if (copying.current) return;
    const text = window.getSelection()?.toString() || pendingText.current;
    if (!text.trim()) return;
    copying.current = true;
    pendingText.current = "";
    let ok = document.execCommand("copy");
    if (!ok) ok = await writeClipboard(text);
    window.getSelection()?.removeAllRanges();
    copying.current = false;
    onCopied(ok);
  }

  function onSelectAll() {
    const root = containerRef.current;
    const selection = window.getSelection();
    if (!root || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(root);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <div
      ref={menuRef}
      className={["selection-menu", above ? "" : "is-below", dragging ? "is-dragging" : ""].filter(Boolean).join(" ")}
      style={{ left, top: anchor.y }}
      role="toolbar"
      aria-label="Text selection"
    >
      <button
        className="pill tool"
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          pendingText.current = window.getSelection()?.toString() ?? "";
          void onCopy();
        }}
        onClick={(event) => {
          if (event.detail === 0) void onCopy();
        }}
      >
        Copy
      </button>
      {anchor.entire ? null : (
        <button
          className="pill tool"
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelectAll();
          }}
          onClick={(event) => {
            if (event.detail === 0) onSelectAll();
          }}
        >
          Select all
        </button>
      )}
    </div>
  );
}
