const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jamiesunderland.md").replace(/\/$/, "");

export const markdownUrl = `${siteUrl}/jamiesunderland.md`;

const prompt = `Read and follow this markdown file exactly: ${markdownUrl}`;

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
