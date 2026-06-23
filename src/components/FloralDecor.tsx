export default function FloralDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <span className="floral-accent animate-sway" style={{ top: "8%", left: "6%" }}>
        🌸
      </span>
      <span className="floral-accent" style={{ top: "18%", right: "8%", animationDelay: "-2s" }}>
        🪻
      </span>
      <span className="floral-accent animate-sway" style={{ top: "42%", left: "4%", fontSize: "1rem" }}>
        🌿
      </span>
      <span className="floral-accent" style={{ bottom: "28%", right: "6%" }}>
        🌷
      </span>
      <span className="floral-accent animate-sway" style={{ bottom: "12%", left: "10%", fontSize: "1.1rem" }}>
        🌼
      </span>
      <span className="floral-accent" style={{ top: "65%", right: "12%", fontSize: "0.9rem" }}>
        ✿
      </span>
      <div
        className="floral-blob absolute"
        style={{
          width: 200,
          height: 200,
          top: "30%",
          right: "-40px",
          background: "var(--color-floral-lavender-light)",
          opacity: 0.35,
          animationDelay: "-8s",
        }}
      />
      <div
        className="floral-blob absolute"
        style={{
          width: 160,
          height: 160,
          bottom: "35%",
          left: "20%",
          background: "var(--color-floral-peach)",
          opacity: 0.2,
          animationDelay: "-3s",
        }}
      />
    </div>
  );
}
