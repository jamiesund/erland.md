import type { Metadata } from "next";
import { markdownUrl, siteUrl, socialLinks } from "@/lib/links";

const description =
  "Chat through your design problems with me. I'll ask you questions so you can explore your thinking.";

export const metadata: Metadata = {
  title: {
    absolute: "Jamiesunderland.md • Chat through your design problems with me",
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "text/markdown": markdownUrl,
    },
  },
};

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jamie Sunderland",
  jobTitle: "Product designer and co-founder",
  description,
  url: siteUrl,
  image: `${siteUrl}/portrait.jpg`,
  homeLocation: {
    "@type": "Place",
    name: "London",
  },
  sameAs: [socialLinks.linkedin, socialLinks.twitter, "https://superhands.ai"],
};

export default function Home() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(person).replace(/</g, "\\u003c"),
      }}
    />
  );
}
