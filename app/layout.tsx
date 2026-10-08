import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteAnalytics } from "@/components/analytics";
import { SiteShell } from "@/components/site-shell";
import { readMarkdownFile } from "@/lib/markdown";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const siteName = "Jamiesunderland.md";
const description = "Chat through your design problems with me.";
const shareTitle =
  "Chat through your design problems with me. I'll ask you questions so you can explore your thinking. Copy or open where you chat with AI.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jamiesunderland.md"),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description,
  openGraph: {
    title: shareTitle,
    description,
    siteName,
    type: "website",
    url: "/",
    images: [
      {
        url: "/og.jpg",
        width: 1024,
        height: 537,
        alt: description,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description,
    images: ["/og.jpg"],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const markdown = await readMarkdownFile();

  return (
    <html lang="en" className={inter.className}>
      <body>
        <SiteShell markdown={markdown} />
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
