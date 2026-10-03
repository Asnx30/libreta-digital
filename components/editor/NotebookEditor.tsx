"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { BackgroundId, JournalElement, JournalPage, Notebook } from "@/types/journal";
import { cloneDemoNotebook } from "@/lib/demo-data";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";
import { uid } from "@/lib/utils";
import { NotebookCanvas } from "@/components/editor/NotebookCanvas";
import { EditorSidebar } from "@/components/editor/EditorSidebar";

const STORAGE_KEY = "cozy-journal-demo";

type DatabaseRow = Record<string, any>;

function localLoad(): Notebook {
  if (typeof window === "undefined") return cloneDemoNotebook();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneDemoNotebook();
  try { return JSON.parse(raw) as Notebook; } catch { return cloneDemoNotebook(); }
}

function localSave(notebook: Notebook) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notebook));
}

async function loadRemoteNotebook(): Promise<Notebook | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  let { data: notebook, error } = await supabase.from("notebooks").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;

  if (!notebook) {
    const demo = cloneDemoNotebook();
    const created = await supabase.from("notebooks").insert({ owner_id: user.id, slug: `my-journal-${user.id.slice(0, 6)}`, title: demo.title, subtitle: demo.subtitle, cover_config: demo.cover_config || {}, is_public: true }).select("*").single();
    if (created.error) throw created.error;
    notebook = created.data;

    const pageRows = demo.pages.map((page, index) => ({ notebook_id: notebook.id, page_index: index, background: page.background, settings: page.settings || {} }));
    const insertedPages = await supabase.from("pages").insert(pageRows).select("*");
    if (insertedPages.error) throw insertedPages.error;

    const pageMap = new Map((insertedPages.data || []).map((page: DatabaseRow) => [page.page_index, page.id]));
    const elementRows = demo.pages.flatMap((page) => page.elements.map((element) => ({
      page_id: pageMap.get(page.page_index), type: element.type, content: element.content || null,
      asset_url: element.asset_url || null, x: element.x, y: element.y, width: element.width, height: element.height,
      rotation: element.rotation, z_index: element.z_index, font_family: element.font_family || null,
      font_size: element.font_size || null, font_weight: element.font_weight || null, color: element.color || null,
      opacity: element.opacity ?? 1, style: element.style || {},
    })));
    if (elementRows.length) {
      const insertedElements = await supabase.from("elements").insert(elementRows).select("*");
      if (insertedElements.error) throw insertedElements.error;
    }
  }

  const pagesResult = await supabase.from("pages").select("*").eq("notebook_id", notebook.id).order("page_index", { ascending: true });
  if (pagesResult.error) throw pagesResult.error;
  const pages = (pagesResult.data || []) as DatabaseRow[];
  const ids = pages.map((page) => page.id);
  let elements: DatabaseRow[] = [];
  if (ids.length) {
    const elementsResult = await supabase.from("elements").select("*").in("page_id", ids).order("z_index", { ascending: true });
    if (elementsResult.error) throw elementsResult.error;
    elements = elementsResult.data || [];
  }

  return {
    ...notebook,
    pages: pages.map((page) => ({ ...page, elements: elements.filter((element) => element.page_id === page.id) })) as JournalPage[],
  } as Notebook;
}

export function NotebookEditor() {
  const [notebook, setNotebook] = useState<Notebook>(() => cloneDemoNotebook());
  const [activePageId, setActivePageId] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState("Abriendo...");
  const [zoom, setZoom] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const history = useRef<Notebook[]>([]);
  const future = useRef<Notebook[]>([]);

  const activePage = useMemo(() => notebook.pages.find((page) => page.id === activePageId) || notebook.pages[0], [notebook.pages, activePageId]);
  const activeIndex = notebook.pages.findIndex((page) => page.id === activePage?.id);
  const left = activeIndex >= 0 && activeIndex % 2 === 1 ? notebook.pages[activeIndex - 1] : activePage;
  const right = activeIndex >= 0 && activeIndex % 2 === 1 ? activePage : notebook.pages[activeIndex + 1];
  const selectedElement = activePage?.elements.find((element) => element.id === selectedId);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!isSupabaseConfigured) {
          const loaded = localLoad();
          if (!alive) return;
          setNotebook(loaded);
          setActivePageId(loaded.pages[0]?.id);
          setSaveState("Guardado local");
          return;
        }
        const remote = await loadRemoteNotebook();
        if (!alive) return;
        if (remote) {
          setNotebook(remote);
          setActivePageId(remote.pages[0]?.id);
          setSaveState("Guardado");
        }
      } catch (error) {
        console.error(error);
        if (alive) setSaveState("Error al cargar");
      }
    })();
    return () => { alive = false; };
  }, []);

  const persist = useCallback(async (next: Notebook) => {
    setSaveState("Guardando...");
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      if (!isSupabaseConfigured) {
        localSave(next);
        setSaveState("Guardado local");
        return;
      }
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      try {
        const { error: notebookError } = await supabase.from("notebooks").update({
          title: next.title,
          subtitle: next.subtitle,
          slug: next.slug,
          is_public: next.is_public,
          cover_config: next.cover_config || {},
        }).eq("id", next.id);
        if (notebookError) throw notebookError;

        const pageRows = next.pages.map((page, index) => ({
          id: page.id, notebook_id: next.id, page_index: index, background: page.background, settings: page.settings || {},
        }));
        if (pageRows.length) {
          const { error: pagesError } = await supabase.from("pages").upsert(pageRows);
          if (pagesError) throw pagesError;
        }

        const elementRows = next.pages.flatMap((page) => page.elements.map((element) => ({
          id: element.id,
          page_id: page.id,
          type: element.type,
          content: element.content || null,
          asset_url: element.asset_url || null,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation,
          z_index: element.z_index,
          font_family: element.font_family || null,
          font_size: element.font_size || null,
          font_weight: element.font_weight || null,
          color: element.color || null,
          opacity: element.opacity ?? 1,
          style: element.style || {},
        })));
        if (elementRows.length) {
          const { error: elementError } = await supabase.from("elements").upsert(elementRows);
          if (elementError) throw elementError;
        }

        // Remove stale elements and pages after saving the current state.
        const existingPagesResult = await supabase.from("pages").select("id").eq("notebook_id", next.id);
        if (existingPagesResult.error) throw existingPagesResult.error;
        const keepPageIds = new Set(next.pages.map((page) => page.id));
        const stalePageIds = (existingPagesResult.data || []).map((row) => row.id).filter((id) => !keepPageIds.has(id));
        if (stalePageIds.length) {
          const { error } = await supabase.from("pages").delete().in("id", stalePageIds);
          if (error) throw error;
        }

        const currentPageIds = next.pages.map((page) => page.id);
        if (currentPageIds.length) {
          const existingElementsResult = await supabase.from("elements").select("id").in("page_id", currentPageIds);
          if (existingElementsResult.error) throw existingElementsResult.error;
          const keepElementIds = new Set(elementRows.map((row) => row.id));
          const staleElementIds = (existingElementsResult.data || []).map((row) => row.id).filter((id) => !keepElementIds.has(id));
          if (staleElementIds.length) {
            const { error } = await supabase.from("elements").delete().in("id", staleElementIds);
            if (error) throw error;
          }
        }
        setSaveState("Guardado");
      } catch (error) {
        console.error(error);
        setSaveState("Error al guardar");
      }
    }, 450);
  }, []);

  function mutate(mutator: (draft: Notebook) => Notebook) {
    const next = mutator(JSON.parse(JSON.stringify(notebook)));
    history.current.push(JSON.parse(JSON.stringify(notebook)));
    if (history.current.length > 50) history.current.shift();
    future.current = [];
    setNotebook(next);
    persist(next);
  }

  function undo() {
    const previous = history.current.pop();
    if (!previous) return;
    future.current.push(JSON.parse(JSON.stringify(notebook)));
    setNotebook(previous);
    persist(previous);
    setSelectedId(null);
    setActivePageId(previous.pages.find((page) => page.id === activePageId)?.id || previous.pages[0]?.id);
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(JSON.parse(JSON.stringify(notebook)));
    setNotebook(next);
    persist(next);
    setSelectedId(null);
    setActivePageId(next.pages.find((page) => page.id === activePageId)?.id || next.pages[0]?.id);
  }

  function addElement(element: Omit<JournalElement, "id" | "page_id">) {
    if (!activePage) return;
    const newElement: JournalElement = { ...element, id: uid("el"), page_id: activePage.id };
    mutate((draft) => ({ ...draft, pages: draft.pages.map((page) => page.id === activePage.id ? { ...page, elements: [...page.elements, newElement] } : page) }));
    setSelectedId(newElement.id);
  }

  function maxZ() { return Math.max(0, ...(activePage?.elements || []).map((e) => e.z_index)); }

  function addText() {
    addElement({ type: "text", content: "Escribe aquí...", x: 12, y: 12, width: 72, height: 12, rotation: -0.6, z_index: maxZ() + 1, font_family: "Caveat", font_size: 6.4, font_weight: 500, color: "#4e4841", opacity: 1, style: {} });
  }

  function addPaper() {
    addElement({ type: "paper", content: "una pequeña nota...", x: 18, y: 18, width: 56, height: 28, rotation: -2.2, z_index: maxZ() + 1, font_family: "Caveat", font_size: 5.4, font_weight: 400, color: "#514a43", opacity: 1, style: {} });
  }

  function addDecoration(kind: string) {
    addElement({ type: "decoration", content: kind, x: kind === "tape" ? 32 : 74, y: kind === "tape" ? 7 : 72, width: kind === "tape" ? 28 : 11, height: kind === "tape" ? 7 : 11, rotation: kind === "tape" ? -4 : 6, z_index: maxZ() + 2, color: kind === "tape" ? "#d3c0a0" : "#74695e", opacity: .8, style: {} });
  }

  function patchElement(patch: Partial<JournalElement>) {
    if (!activePage || !selectedId) return;
    mutate((draft) => ({ ...draft, pages: draft.pages.map((page) => page.id === activePage.id ? { ...page, elements: page.elements.map((el) => el.id === selectedId ? { ...el, ...patch } : el) } : page) }));
  }

  function transformElement(pageId: string, elementId: string, patch: Partial<Pick<JournalElement, "x" | "y" | "width" | "height" | "rotation">>) {
    const next = { ...notebook, pages: notebook.pages.map((page) => page.id === pageId ? { ...page, elements: page.elements.map((element) => element.id === elementId ? { ...element, ...patch } : element) } : page) };
    setNotebook(next);
    setSaveState("Guardando...");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 700);
  }

  function duplicateElement() {
    if (!activePage || !selectedElement) return;
    const copy: JournalElement = { ...selectedElement, id: uid("el"), x: Math.min(selectedElement.x + 4, 75), y: Math.min(selectedElement.y + 4, 82), z_index: maxZ() + 1 };
    mutate((draft) => ({ ...draft, pages: draft.pages.map((page) => page.id === activePage.id ? { ...page, elements: [...page.elements, copy] } : page) }));
    setSelectedId(copy.id);
  }

  function deleteElement() {
    if (!activePage || !selectedId) return;
    mutate((draft) => ({ ...draft, pages: draft.pages.map((page) => page.id === activePage.id ? { ...page, elements: page.elements.filter((el) => el.id !== selectedId) } : page) }));
    setSelectedId(null);
  }

  function layer(delta: number) {
    if (!activePage || !selectedId) return;
    const max = maxZ();
    patchElement({ z_index: Math.max(1, Math.min(max + 2, (selectedElement?.z_index || 1) + delta)) });
  }

  function changeBackground(background: BackgroundId) {
    if (!activePage) return;
    mutate((draft) => ({ ...draft, pages: draft.pages.map((page) => page.id === activePage.id ? { ...page, background } : page) }));
  }

  function addPage() {
    const newPage: JournalPage = { id: uid("page"), notebook_id: notebook.id, page_index: notebook.pages.length, background: "paper-cream", settings: {}, elements: [] };
    mutate((draft) => ({ ...draft, pages: [...draft.pages, newPage] }));
    setActivePageId(newPage.id);
    setSelectedId(null);
  }

  function duplicatePage() {
    if (!activePage) return;
    const newPage: JournalPage = { ...JSON.parse(JSON.stringify(activePage)), id: uid("page"), page_index: notebook.pages.length, elements: activePage.elements.map((element) => ({ ...JSON.parse(JSON.stringify(element)), id: uid("el") })) };
    mutate((draft) => ({ ...draft, pages: [...draft.pages, newPage] }));
    setActivePageId(newPage.id);
    setSelectedId(null);
  }

  function deletePage() {
    if (!activePage || notebook.pages.length <= 1) return;
    const filtered = notebook.pages.filter((page) => page.id !== activePage.id).map((page, index) => ({ ...page, page_index: index }));
    mutate((draft) => ({ ...draft, pages: filtered }));
    setActivePageId(filtered[0]?.id);
    setSelectedId(null);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activePage) return;
    if (!file.type.startsWith("image/")) { setSaveState("Selecciona una imagen"); return; }
    if (file.size > 15 * 1024 * 1024) { setSaveState("Máximo 15 MB"); return; }
    setSaveState("Subiendo...");
    let url = "";
    if (!isSupabaseConfigured) {
      url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } else {
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setSaveState("Inicia sesión"); return; }
      const clean = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${data.user.id}/${Date.now()}-${clean}`;
      const uploaded = await supabase.storage.from("notebook-images").upload(path, file, { upsert: false, contentType: file.type });
      if (uploaded.error) { console.error(uploaded.error); setSaveState("Error de subida"); return; }
      url = supabase.storage.from("notebook-images").getPublicUrl(path).data.publicUrl;
    }
    addElement({ type: "image", content: "polaroid", asset_url: url, x: 19, y: 24, width: 55, height: 42, rotation: -3.5, z_index: maxZ() + 3, opacity: 1, style: { caption: file.name.replace(/\.[^.]+$/, "") } });
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") deleteElement();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/blog/${notebook.slug}` : `/blog/${notebook.slug}`;

  function patchNotebook(patch: { title?: string; subtitle?: string; slug?: string; is_public?: boolean }) {
    mutate((draft) => ({ ...draft, ...patch }));
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: notebook.title, url: publicUrl });
      else await navigator.clipboard.writeText(publicUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {}
  }

  return (
    <main className="editor-shell">
      <div className="desk-texture" />
      <div className="editor-topbar">
        <div className="editor-brand"><strong>{notebook.title}</strong><span className="status">· {saveState}</span></div>
        <div className="editor-actions">
          <button className="toolbar-btn" onClick={() => setZoom((z) => Math.max(.75, z - .1))}>−</button>
          <span className="status">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={() => setZoom((z) => Math.min(1.35, z + .1))}>+</button>
          <button className="toolbar-btn" onClick={() => setZoom(1)}>Reset</button>
          <Link className="toolbar-btn" href={`/blog/${notebook.slug}`}>Vista pública</Link>
          <button className="toolbar-btn primary" onClick={share}>{shareCopied ? "Enlace copiado" : "Compartir"}</button>
          {isSupabaseConfigured && <button className="toolbar-btn" onClick={async () => { await getSupabaseBrowser()?.auth.signOut(); window.location.href = "/admin/login"; }}>Salir</button>}
        </div>
      </div>

      <div className="editor-main">
        <section className="editor-canvas-card">
          <div className="editor-book" style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 180ms ease" }}>
            <NotebookCanvas
              left={left}
              right={right}
              activePageId={activePage?.id}
              selectedId={selectedId}
              onActivatePage={(id) => { setActivePageId(id); setSelectedId(null); }}
              onSelectElement={setSelectedId}
              onTransformElement={transformElement}
            />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:4, flexWrap:"wrap" }}>
            <button className="toolbar-btn primary" onClick={addPage}>+ Nueva página</button>
            <button className="toolbar-btn" onClick={duplicatePage}>Duplicar página</button>
            <button className="toolbar-btn danger" onClick={deletePage}>Eliminar página</button>
          </div>
        </section>

        <EditorSidebar
          pages={notebook.pages}
          activePage={activePage}
          selectedElement={selectedElement}
          onPageSelect={(id) => { setActivePageId(id); setSelectedId(null); }}
          onAddText={addText}
          onAddPaper={addPaper}
          onAddDecoration={addDecoration}
          onDelete={deleteElement}
          onDuplicate={duplicateElement}
          onBringFront={() => layer(10)}
          onSendBack={() => layer(-10)}
          onPatchElement={patchElement}
          onChangeBackground={changeBackground}
          onUpload={() => fileInputRef.current?.click()}
          notebookTitle={notebook.title}
          notebookSubtitle={notebook.subtitle || ""}
          notebookSlug={notebook.slug}
          notebookPublic={notebook.is_public}
          onNotebookPatch={patchNotebook}
        />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
    </main>
  );
}
