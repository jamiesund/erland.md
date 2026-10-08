import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/links";

const allowAll = { allow: "/" };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...allowAll },
      { userAgent: "GPTBot", ...allowAll },
      { userAgent: "ClaudeBot", ...allowAll },
      { userAgent: "PerplexityBot", ...allowAll },
      { userAgent: "Google-Extended", ...allowAll },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
