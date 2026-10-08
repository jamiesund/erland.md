let locks = 0;
let saved: { html: string; body: string; top: number } | null = null;

function mobile() {
  return window.matchMedia("(max-width: 800px)").matches;
}

export function lockPageScroll() {
  locks += 1;
  if (locks > 1) return;

  const html = document.documentElement;
  const body = document.body;
  const top = window.scrollY;
  saved = { html: html.style.overflow, body: body.style.overflow, top };
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";

  if (!mobile()) return;
  body.style.position = "fixed";
  body.style.top = `-${top}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
}

export function unlockPageScroll() {
  if (locks === 0) return;
  locks -= 1;
  if (locks > 0) return;

  const html = document.documentElement;
  const body = document.body;
  const top = saved?.top ?? Math.max(0, -Number.parseFloat(body.style.top || "0") || 0);
  html.style.overflow = saved?.html ?? "";
  body.style.overflow = saved?.body ?? "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  saved = null;
  window.scrollTo(0, top);
  // Safari keeps a stale visual viewport after a fixed page or the keyboard
  // goes away, so taps and scrolling stay dead until the offset is rewritten.
  window.requestAnimationFrame(() => window.scrollTo(0, top));
}
