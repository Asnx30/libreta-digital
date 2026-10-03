"use client";

import type { JournalElement } from "@/types/journal";
import { allFonts } from "@/lib/fonts";

export function ElementProperties({ element, onPatch }: { element?: JournalElement; onPatch: (patch: Partial<JournalElement>) => void }) {
  if (!element) return <p>Selecciona un elemento para editarlo.</p>;
  const style = element.style || {};
  return (
    <div className="properties">
      {(element.type === "text" || element.type === "paper") && <div className="field"><label>Contenido</label><textarea value={element.content || ""} onChange={(e) => onPatch({ content: e.target.value })} /></div>}
      {(element.type === "text" || element.type === "paper") && <>
        <div className="field"><label>Fuente</label><select value={element.font_family || "Inter"} onChange={(e) => onPatch({ font_family: e.target.value })}>{allFonts.map((font) => <option key={font}>{font}</option>)}</select></div>
        <div className="inline">
          <div className="field"><label>Tamaño</label><input type="number" min="2" max="15" step="0.1" value={element.font_size || 5} onChange={(e) => onPatch({ font_size: Number(e.target.value) })} /></div>
          <div className="field"><label>Rotación</label><input type="number" min="-180" max="180" step="0.5" value={element.rotation} onChange={(e) => onPatch({ rotation: Number(e.target.value) })} /></div>
        </div>
        <div className="field"><label>Alineación</label><select value={String(style.textAlign || "left")} onChange={(e) => onPatch({ style: { ...style, textAlign: e.target.value } })}><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></div>
        <div className="field"><label>Color</label><input type="text" value={element.color || "#46413b"} onChange={(e) => onPatch({ color: e.target.value })} /></div>
      </>}
      {element.type === "image" && <>
        <div className="field"><label>Estilo de foto</label><select value={element.content || "photo"} onChange={(e) => onPatch({ content: e.target.value })}><option value="photo">Foto</option><option value="polaroid">Polaroid</option><option value="torn">Recorte</option></select></div>
        <div className="field"><label>Pie de foto</label><input type="text" value={String(style.caption || "")} onChange={(e) => onPatch({ style: { ...style, caption: e.target.value } })} /></div>
        <div className="field"><label>Rotación</label><input type="number" min="-180" max="180" step="0.5" value={element.rotation} onChange={(e) => onPatch({ rotation: Number(e.target.value) })} /></div>
      </>}
      <div className="inline">
        <div className="field"><label>Anchura %</label><input type="number" min="3" max="95" step="0.5" value={element.width} onChange={(e) => onPatch({ width: Number(e.target.value) })} /></div>
        <div className="field"><label>Altura %</label><input type="number" min="3" max="95" step="0.5" value={element.height} onChange={(e) => onPatch({ height: Number(e.target.value) })} /></div>
      </div>
    </div>
  );
}
