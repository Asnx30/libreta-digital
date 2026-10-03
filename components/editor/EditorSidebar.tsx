"use client";

import type { BackgroundId, JournalElement, JournalPage } from "@/types/journal";
import { ElementProperties } from "@/components/editor/ElementProperties";
import { NotebookPage } from "@/components/notebook/NotebookPage";

const backgrounds: Array<{ id: BackgroundId; label: string }> = [
  { id: "paper-cream", label: "Crema" }, { id: "paper-white", label: "Blanco" }, { id: "paper-warm", label: "Cálido" },
  { id: "paper-grid", label: "Cuadrícula" }, { id: "paper-dots", label: "Puntos" }, { id: "paper-speckle", label: "Motas" },
];

export function EditorSidebar({ pages, activePage, selectedElement, onPageSelect, onAddText, onAddPaper, onAddDecoration, onDelete, onDuplicate, onBringFront, onSendBack, onPatchElement, onChangeBackground, onUpload, notebookTitle, notebookSubtitle, notebookSlug, notebookPublic, onNotebookPatch }: {
  pages: JournalPage[]; activePage?: JournalPage; selectedElement?: JournalElement;
  onPageSelect: (pageId: string) => void; onAddText: () => void; onAddPaper: () => void; onAddDecoration: (kind: string) => void; onDelete: () => void; onDuplicate: () => void; onBringFront: () => void; onSendBack: () => void; onPatchElement: (patch: Partial<JournalElement>) => void; onChangeBackground: (background: BackgroundId) => void; onUpload: () => void;
  notebookTitle: string; notebookSubtitle: string; notebookSlug: string; notebookPublic: boolean; onNotebookPatch: (patch: { title?: string; subtitle?: string; slug?: string; is_public?: boolean }) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="panel"><h3>Libreta</h3><div className="properties">
        <div className="field"><label>Título</label><input value={notebookTitle} onChange={(e) => onNotebookPatch({ title: e.target.value })} /></div>
        <div className="field"><label>Subtítulo</label><input value={notebookSubtitle} onChange={(e) => onNotebookPatch({ subtitle: e.target.value })} /></div>
        <div className="field"><label>Slug público</label><input value={notebookSlug} onChange={(e) => onNotebookPatch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5d554d" }}><input type="checkbox" checked={notebookPublic} onChange={(e) => onNotebookPatch({ is_public: e.target.checked })} /> Publicada</label>
      </div></div>

      <div className="panel"><h3>Añadir</h3><div className="tool-grid">
        <button className="tool" onClick={onAddText}>Texto<small>escribir</small></button>
        <button className="tool" onClick={onUpload}>Foto<small>subir imagen</small></button>
        <button className="tool" onClick={onAddPaper}>Papel<small>recorte</small></button>
        <button className="tool" onClick={() => onAddDecoration("flower")}>Flor<small>decoración</small></button>
        <button className="tool" onClick={() => onAddDecoration("tape")}>Cinta<small>washi tape</small></button>
        <button className="tool" onClick={() => onAddDecoration("star")}>Estrella<small>garabato</small></button>
        <button className="tool" onClick={() => onAddDecoration("clip")}>Clip<small>papelería</small></button>
      </div></div>

      <div className="panel"><h3>Páginas</h3><div className="thumbs">
        {pages.map((page) => <button key={page.id} className={`thumb ${page.id === activePage?.id ? "active" : ""}`} onClick={() => onPageSelect(page.id)}><NotebookPage page={page} /><span>{page.page_index + 1}</span></button>)}
      </div></div>

      <div className="panel"><h3>Fondo</h3><select style={{ width: "100%", border: "1px solid rgba(69,55,42,.13)", background: "#fffdf8", borderRadius: 9, padding: 7 }} value={activePage?.background || "paper-cream"} onChange={(e) => onChangeBackground(e.target.value as BackgroundId)}>{backgrounds.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></div>

      <div className="panel"><h3>Elemento seleccionado</h3><ElementProperties element={selectedElement} onPatch={onPatchElement} />{selectedElement && <div className="tool-grid" style={{ marginTop: 10 }}>
        <button className="tool" onClick={onDuplicate}>Duplicar</button><button className="tool" onClick={onDelete}>Eliminar</button><button className="tool" onClick={onBringFront}>Al frente</button><button className="tool" onClick={onSendBack}>Atrás</button>
      </div>}</div>
    </aside>
  );
}
