export function DecorativeElement({ kind = "flower", color = "#756c61" }: { kind?: string; color?: string }) {
  if (kind === "tape") {
    return <div style={{ width: "100%", height: "100%", background: `linear-gradient(105deg, ${color}cc, ${color}82)`, boxShadow: "inset 0 0 0 1px rgba(80,60,40,.08)" }} />;
  }
  if (kind === "clip") {
    return <div style={{ width: "62%", height: "100%", margin: "0 auto", border: `3px solid ${color}`, borderRadius: "45% 45% 52% 52%", transform: "rotate(8deg)", boxShadow: "0 2px 0 rgba(80,60,40,.08)" }} />;
  }
  if (kind === "star") {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <path d="M50 6 L61 38 L94 38 L67 57 L77 91 L50 71 L23 91 L33 57 L6 38 L39 38 Z" fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="3.3" strokeLinecap="round">
        <ellipse cx="50" cy="25" rx="10" ry="20" />
        <ellipse cx="75" cy="50" rx="20" ry="10" />
        <ellipse cx="50" cy="75" rx="10" ry="20" />
        <ellipse cx="25" cy="50" rx="20" ry="10" />
        <circle cx="50" cy="50" r="6" fill={color} />
        <path d="M50 63 C51 77 46 87 35 94" />
      </g>
    </svg>
  );
}
