import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import type { VoteChoice } from "@/types/votes";

export const runtime = "edge";

function parseResult(value: string | null): VoteChoice | "pending" {
  if (value === "fille" || value === "garcon") return value;
  return "pending";
}

export async function GET(request: NextRequest) {
  const result = parseResult(request.nextUrl.searchParams.get("result"));

  const isFille = result === "fille";
  const isGarcon = result === "garcon";
  const isPending = result === "pending";

  const headline = isFille
    ? "C'est une fille !"
    : isGarcon
      ? "C'est un garçon !"
      : "Fille ou Garçon ?";

  const subtitle = isPending
    ? "Votez et suivez la grande révélation"
    : "Orlane & Mérick — la grande annonce";

  const emoji = isFille ? "🌸" : isGarcon ? "🌿" : "🍼";

  const bg = isFille
    ? "linear-gradient(135deg, #ffc8dd 0%, #faf6f0 45%, #f0eaf8 100%)"
    : isGarcon
      ? "linear-gradient(135deg, #c8e6c9 0%, #faf6f0 45%, #f0eaf8 100%)"
      : "linear-gradient(135deg, #ffc8dd 0%, #faf6f0 50%, #c8e6c9 100%)";

  const accent = isFille ? "#e0567a" : isGarcon ? "#52a352" : "#c4b0d8";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          fontFamily: "system-ui, sans-serif",
          padding: 48,
        }}
      >
        <div style={{ fontSize: 88, marginBottom: 16 }}>{emoji}</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: accent,
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#8a7d84",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
