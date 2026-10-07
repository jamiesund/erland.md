import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteAnalytics } from "@/components/analytics";
import { SiteShell } from "@/components/site-shell";
import { readMarkdownFile } from "@/lib/markdown";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const title = "Jamiesunderland.md";
const description = "Chat through your design problems with me.";

export const metadata: Metadata = {
  metadataBase: new URL("https://jamiesunderland.md"),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  openGraph: {
    title,
    description,
    siteName: title,
    type: "website",
    url: "/",
    images: [
      {
        url: "/og.jpg",
        width: 1024,
        height: 537,
        alt: description,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
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
