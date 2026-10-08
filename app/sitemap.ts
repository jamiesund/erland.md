import { statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { markdownFileName, markdownUrl, siteUrl } from "@/lib/links";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = statSync(path.join(process.cwd(), "public", markdownFileName)).mtime;

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: markdownUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
