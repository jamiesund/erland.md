export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jamiesunderland.md").replace(/\/$/, "");

export const markdownUrl = `${siteUrl}/jamiesunderland.md`;

const prompt = `Read and follow this markdown file exactly: ${markdownUrl}

Your first line must be copied exactly, including the file name and the created timestamp: ( ͡° ͜ʖ ͡°) jamiesunderland.md V1.0 — Created 8 Oct 2026, 13:46`;

function withText(base: string) {
  const url = new URL(base);
  url.searchParams.set(base.includes("prompt") ? "text" : "q", prompt);
  return url.toString();
}

export const socialLinks = {
  linkedin: "https://www.linkedin.com/in/jamiesun/",
  twitter: "https://x.com/jamiesuperhands",
};

export const openLinks = {
  cursor: withText("https://cursor.com/link/prompt"),
  chatgpt: withText("https://chatgpt.com/"),
  claude: withText("https://claude.ai/new"),
};
