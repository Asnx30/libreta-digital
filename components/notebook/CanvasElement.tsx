"use client";

import type { JournalElement } from "@/types/journal";
import { DecorativeElement } from "@/components/notebook/DecorativeElement";
import { cn } from "@/lib/utils";

export type HandleType = "resize" | "rotate";

export function CanvasElement({
  element,
  interactive = false,
  selected = false,
  onPointerDown,
  onHandlePointerDown,
}: {
  element: JournalElement;
  interactive?: boolean;
  selected?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>, element: JournalElement) => void;
  onHandlePointerDown?: (event: React.PointerEvent<HTMLDivElement>, element: JournalElement, handle: HandleType) => void;
}) {
  const style = element.style ?? {};
  const fontSize = element.font_size ?? 5;
  const transform = `translate(${element.x}%, ${element.y}%) rotate(${element.rotation}deg)`;
  const baseStyle: React.CSSProperties = {
    left: 0,
    top: 0,
    width: `${element.width}%`,
    height: `${element.height}%`,
    transform,
    zIndex: element.z_index,
    opacity: element.opacity,
    cursor: interactive ? "grab" : "default",
  };

  const handles = interactive && selected ? (
    <>
      <div className="element-handle resize" onPointerDown={(event) => onHandlePointerDown?.(event, element, "resize")} />
      <div className="element-handle rotate" onPointerDown={(event) => onHandlePointerDown?.(event, element, "rotate")} />
    </>
  ) : null;

  if (element.type === "text") {
    return (
      <div
        className={cn("element", "text", selected && "is-selected")}
        style={{ ...baseStyle, fontFamily: element.font_family || "Inter", fontSize: `${fontSize}cqw`, fontWeight: element.font_weight || 400, lineHeight: typeof style.lineHeight === "number" ? style.lineHeight : 1.35, color: element.color || "#46413b", textAlign: (style.textAlign as React.CSSProperties["textAlign"]) || "left", letterSpacing: (style.letterSpacing as string) || undefined }}
        onPointerDown={(event) => onPointerDown?.(event, element)}
      >
        {element.content || "Escribe algo..."}
        {handles}
      </div>
    );
  }

  if (element.type === "image") {
    const mode = element.content || "photo";
    const className = cn("element", "image", selected && "is-selected", mode === "polaroid" ? "polaroid" : mode === "torn" ? "photo-torn" : "photo-plain");
    return (
      <div className={className} style={baseStyle} onPointerDown={(event) => onPointerDown?.(event, element)}>
        {element.asset_url ? <img src={element.asset_url} alt="" draggable={false} /> : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#c5b9a9,#e7ded1 46%,#9e927f)", display: "grid", placeItems: "center", fontFamily: "Caveat", color: "#665c52" }}>photo</div>}
        {mode === "polaroid" && <div className="polaroid-caption">{String(style.caption || "a little memory")}</div>}
        {handles}
      </div>
    );
  }

  if (element.type === "paper") {
    return (
      <div className={cn("element", "paper", selected && "is-selected")} style={{ ...baseStyle, fontFamily: element.font_family || "Caveat", fontSize: `${fontSize}cqw`, color: element.color || "#504a44" }} onPointerDown={(event) => onPointerDown?.(event, element)}>
        {element.content || "nota"}
        {handles}
      </div>
    );
  }

  return (
    <div className={cn("element", selected && "is-selected")} style={baseStyle} onPointerDown={(event) => onPointerDown?.(event, element)}>
      <DecorativeElement kind={element.content || "flower"} color={element.color || "#756c61"} />
      {handles}
    </div>
  );
}
