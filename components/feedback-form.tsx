"use client";

import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { LinkedInIcon, ResetIcon, TwitterIcon } from "@/components/icons";
import { socialLinks } from "@/lib/links";

const OPTIONS = [
  { label: "The questions helped", tone: "positive" },
  { label: "A story landed", tone: "positive" },
  { label: "It got to the point", tone: "positive" },
  { label: "The tone felt right", tone: "positive" },
  { label: "It helped me see the real problem", tone: "positive" },
  { label: "It only asked, never landed", tone: "negative" },
  { label: "It lectured", tone: "negative" },
  { label: "Startup lens didn't fit", tone: "negative" },
  { label: "The stories didn't fit", tone: "negative" },
  { label: "Wouldn't look at the work", tone: "negative" },
  { label: "The tone felt off", tone: "negative" },
  { label: "Something else" },
] as const;

const DETAIL_HEIGHT = 81;

type Status = "idle" | "sending" | "error";
type Step = "compose" | "thanks";

function fitDetail(field: HTMLTextAreaElement) {
  field.style.height = `${DETAIL_HEIGHT}px`;
  const border = field.offsetHeight - field.clientHeight;
  field.style.height = `${Math.max(field.scrollHeight + border, DETAIL_HEIGHT)}px`;
}

export function FeedbackForm({ onStep }: { onStep?: (step: Step) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [step, setStep] = useState<Step>("compose");
  const detailRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const ready = choices.length > 0 || detail.trim().length > 0;

  useLayoutEffect(() => {
    if (detailRef.current) fitDetail(detailRef.current);
  }, []);

  useLayoutEffect(() => {
    if (step === "thanks" && !emailSent) emailRef.current?.focus();
  }, [step, emailSent]);

  async function post(message: string, email: FormDataEntryValue | null, company: FormDataEntryValue | null) {
    if (typeof company === "string" && company.trim()) {
      return true;
    }

    setStatus("sending");
    setError("");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, email }),
    });

    if (response.ok || response.status === 503) {
      setStatus("idle");
      return true;
    }

    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setStatus("error");
    setError(body?.error ?? "Couldn't send that. Try again in a minute.");
    return false;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const comment = String(data.get("message") ?? "").trim();
    const picked = OPTIONS.filter((option) => choices.includes(option.label))
      .map((option) => option.label)
      .join("\n");
    const message = [picked, comment].filter(Boolean).join("\n\n");

    if (!message) {
      setStatus("error");
      setError("Write a note first.");
      return;
    }

    const sent = await post(message, null, data.get("company"));
    if (sent) {
      setNote(message);
      setStatus("idle");
      setStep("thanks");
      onStep?.("thanks");
    }
  }

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const replyTo = email.trim();
    if (!replyTo) return;

    const sent = await post(note, replyTo, null);
    if (sent) setEmailSent(true);
  }

  if (step === "thanks") {
    return (
      <div className="feedback-form">
        {emailSent ? (
          <p className="form-success">I'll follow up there.</p>
        ) : (
          <form className="feedback-followup" onSubmit={onEmail}>
            <label>
              <span>Email, if you want me to follow up</span>
                <input
                  ref={emailRef}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
            </label>
            {status === "error" ? <p className="form-error">{error}</p> : null}
            {email.trim() ? (
              <button className="pill tool send done" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending" : "Send"}
              </button>
            ) : null}
          </form>
        )}
        <div className="feedback-connect">
          <a className="pill tool" href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
            <LinkedInIcon />
            LinkedIn
          </a>
          <a className="pill tool" href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
            <TwitterIcon />
            Twitter
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={onSubmit}>
      <div className="feedback-options" role="group" aria-label="Quick feedback">
        {OPTIONS.map((option) => (
          <button
            key={option.label}
            className={[
              "pill tool feedback-option",
              "tone" in option && option.tone === "positive" ? "is-positive" : "",
              "tone" in option && option.tone === "negative" ? "is-negative" : "",
              choices.includes(option.label) ? "is-selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            aria-pressed={choices.includes(option.label)}
            disabled={status === "sending"}
            onClick={() => {
              setChoices((current) =>
                current.includes(option.label) ? current.filter((item) => item !== option.label) : [...current, option.label],
              );
              if (option.label === "Something else") detailRef.current?.focus();
            }}
          >
            {option.label}
          </button>
        ))}
        {choices.length > 1 ? (
          <button className="feedback-reset" type="button" disabled={status === "sending"} onClick={() => setChoices([])}>
            <ResetIcon />
            Reset
          </button>
        ) : null}
      </div>
      <label className="feedback-detail">
        <textarea
          ref={detailRef}
          name="message"
          rows={4}
          maxLength={5000}
          placeholder="Type some details.."
          aria-label="Type some details.."
          onInput={(event) => {
            fitDetail(event.currentTarget);
            setDetail(event.currentTarget.value);
          }}
        />
      </label>
      <button className="pill tool send done" type="submit" disabled={!ready || status === "sending"}>
        {status === "sending" ? "Sending" : "Done"}
      </button>
      <label className="hp" aria-hidden="true">
        <span>Company</span>
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      {status === "error" ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
