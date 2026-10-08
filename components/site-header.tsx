"use client";

import { useEffect, useState, type RefObject } from "react";
import { Brand } from "@/components/brand";
import { ChatGptIcon, CheckIcon, ClaudeIcon, CopyIcon, CursorIcon } from "@/components/icons";
import { openLinks } from "@/lib/links";

export const COPIED_HOLD_MS = 4000;
export const BANNER_EXIT_MS = 400;

export function useMarkdownCopy(markdown: string, pageRef: RefObject<HTMLElement | null>) {
  const [copied, setCopied] = useState(false);
  const [noteId, setNoteId] = useState(0);
  const [ringing, setRinging] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    if (!copied) return;
    setRinging(true);
    const frame = window.requestAnimationFrame(() => {
      pageRef.current?.querySelectorAll(".copy").forEach((node) => {
        node.getAnimations().forEach((animation) => {
          if (!(animation instanceof CSSAnimation) || animation.animationName !== "ring-angle") return;
          animation.cancel();
          animation.play();
        });
      });
    });
    const timer = window.setTimeout(() => setCopied(false), COPIED_HOLD_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [copied, noteId, pageRef]);

  useEffect(() => {
    if (copied || !ringing) return;
    const timer = window.setTimeout(() => setRinging(false), BANNER_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [copied, ringing]);

  async function copyFile() {
    if (copied) {
      setCopied(false);
      setCopyError(false);
      return;
    }

    setCopyError(false);
    const area = document.createElement("textarea");
    area.value = markdown;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    const x = window.scrollX;
    const y = window.scrollY;
    area.focus({ preventScroll: true });
    area.select();
    const legacy = document.execCommand("copy");
    area.remove();
    if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
    if (legacy) {
      confirmCopy(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      confirmCopy(true);
    } catch {
      confirmCopy(false);
    }
  }

  function confirmCopy(ok: boolean) {
    if (!ok) {
      setCopied(false);
      setCopyError(true);
      return;
    }
    setCopyError(false);
    setCopied(true);
    setNoteId((id) => id + 1);
  }

  return { copied, ringing, copyError, copyFile, confirmCopy, showNote: copied || copyError };
}

export function SiteHeader({
  copied,
  copyError,
  showNote,
  onCopy,
}: {
  copied: boolean;
  copyError: boolean;
  showNote: boolean;
  onCopy: () => void;
}) {
  return (
    <header className="top">
      <div className="shell top-row">
        <Brand />
        <div className="actions">
          <button className="pill copy" type="button" data-track="Copy · Header" onClick={onCopy}>
            <CopyControl copied={copied} iconFirst />
          </button>
          <span className="open-label">Open in</span>
          <div className="tools">
            <a className="pill tool" href={openLinks.cursor} target="_blank" rel="noopener noreferrer" data-track="Open in Cursor">
              <CursorIcon />
              <span>Cursor</span>
            </a>
            <a className="pill tool" href={openLinks.chatgpt} target="_blank" rel="noopener noreferrer" data-track="Open in ChatGPT">
              <ChatGptIcon />
              <span>ChatGPT</span>
            </a>
            <a className="pill tool" href={openLinks.claude} target="_blank" rel="noopener noreferrer" data-track="Open in Claude">
              <ClaudeIcon />
              <span>Claude</span>
            </a>
          </div>
        </div>
      </div>
      <div className={showNote ? "toast desktop-toast is-visible" : "toast desktop-toast"} role="status" aria-hidden={!showNote}>
        <span className="toast-line" />
        <p>{copyError ? "Couldn't copy from this browser." : "Paste wherever you chat with AI"}</p>
        <span className="toast-line" />
      </div>
    </header>
  );
}

export function CopyControl({ copied, iconFirst = false }: { copied: boolean; iconFirst?: boolean }) {
  const icon = (
    <span className="copy-swap">
      <CopyIcon />
      <CheckIcon />
    </span>
  );
  const label = (
    <span className="copy-swap">
      <span aria-hidden={copied}>Copy</span>
      <span aria-hidden={!copied}>Copied</span>
    </span>
  );

  return iconFirst ? (
    <>
      {icon}
      {label}
    </>
  ) : (
    <>
      {label}
      {icon}
    </>
  );
}
