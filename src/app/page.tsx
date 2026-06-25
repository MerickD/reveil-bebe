import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";
import { getRevealState } from "@/lib/reveal";
import { getRevealHeadline } from "@/lib/reveal-share";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const state = await getRevealState();
  const baseUrl = getBaseUrl();

  if (state?.isRevealed && state.result) {
    const headline = getRevealHeadline(state.result);
    const description =
      "La grande révélation d'Orlane & Mérick est enfin là ! Merci d'avoir joué le jeu avec nous.";
    const ogImage = `${baseUrl}/api/og?result=${state.result}`;

    return {
      title: `${headline} — Orlane & Mérick`,
      description,
      openGraph: {
        title: headline,
        description,
        url: baseUrl,
        siteName: "Révélation Bébé — Orlane & Mérick",
        locale: "fr_FR",
        type: "website",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: headline,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: headline,
        description,
        images: [ogImage],
      },
    };
  }

  const title = "Fille ou Garçon ? — Révélation Bébé";
  const description =
    "Votez Team Fille ou Team Garçon et suivez la tendance en temps réel avant la grande révélation !";
  const ogImage = `${baseUrl}/api/og?result=pending`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: "Révélation Bébé — Orlane & Mérick",
      locale: "fr_FR",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Home() {
  return <HomeContent />;
}
