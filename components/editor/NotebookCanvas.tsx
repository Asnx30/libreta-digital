"use client";

import { useRef, useState } from "react";
import type { JournalElement, JournalPage } from "@/types/journal";
import { NotebookPage } from "@/components/notebook/NotebookPage";
import { clamp } from "@/lib/utils";

type DragState =
  | { mode: "move"; pageId: string; id: string; startX: number; startY: number; x: number; y: number; }
  | { mode: "resize"; pageId: string; id: string; startX: number; startY: number; width: number; height: number; }
  | { mode: "rotate"; pageId: string; id: string; centerX: number; centerY: number; startAngle: number; startRotation: number; }
  | null;

export function NotebookCanvas({ left, right, activePageId, selectedId, onActivatePage, onSelectElement, onTransformElement }: {
  left?: JournalPage; right?: JournalPage; activePageId?: string; selectedId?: string | null;
  onActivatePage: (pageId: string) => void;
  onSelectElement: (elementId: string) => void;
  onTransformElement: (pageId: string, elementId: string, patch: Partial<Pick<JournalElement, "x" | "y" | "width" | "height" | "rotation">>) => void;
}) {
  const [drag, setDrag] = useState<DragState>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  function pageRef(pageId: string) { return pageId === left?.id ? leftRef.current : rightRef.current; }

  function onElementPointerDown(pageId: string, event: React.PointerEvent<HTMLDivElement>, element: JournalElement) {
    event.stopPropagation();
    onActivatePage(pageId);
    onSelectElement(element.id);
    const page = pageRef(pageId);
    if (!page) return;
    try { page.setPointerCapture(event.pointerId); } catch {}
    setDrag({ mode: "move", pageId, id: element.id, startX: event.clientX, startY: event.clientY, x: element.x, y: element.y });
  }

  function onHandlePointerDown(pageId: string, event: React.PointerEvent<HTMLDivElement>, element: JournalElement, handle: "resize" | "rotate") {
    event.stopPropagation();
    event.preventDefault();
    onActivatePage(pageId);
    onSelectElement(element.id);
    const page = pageRef(pageId);
    if (!page) return;
    try { page.setPointerCapture(event.pointerId); } catch {}
    if (handle === "resize") {
      setDrag({ mode: "resize", pageId, id: element.id, startX: event.clientX, startY: event.clientY, width: element.width, height: element.height });
      return;
    }
    const target = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!target) return;
    const centerX = target.left + target.width / 2;
    const centerY = target.top + target.height / 2;
    const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
    setDrag({ mode: "rotate", pageId, id: element.id, centerX, centerY, startAngle, startRotation: element.rotation });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const page = pageRef(drag.pageId);
    if (!page) return;
    const rect = page.getBoundingClientRect();
    if (drag.mode === "move") {
      const dx = ((event.clientX - drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - drag.startY) / rect.height) * 100;
      onTransformElement(drag.pageId, drag.id, { x: clamp(drag.x + dx, 0, 97), y: clamp(drag.y + dy, 0, 97) });
    } else if (drag.mode === "resize") {
      const dw = ((event.clientX - drag.startX) / rect.width) * 100;
      const dh = ((event.clientY - drag.startY) / rect.height) * 100;
      onTransformElement(drag.pageId, drag.id, { width: clamp(drag.width + dw, 3, 95), height: clamp(drag.height + dh, 3, 95) });
    } else {
      const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI;
      const delta = angle - drag.startAngle;
      onTransformElement(drag.pageId, drag.id, { rotation: Math.round((drag.startRotation + delta) * 2) / 2 });
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const page = drag ? pageRef(drag.pageId) : null;
    if (page) { try { page.releasePointerCapture(event.pointerId); } catch {} }
    setDrag(null);
  }

  const common = { editable: true, selectedId, onElementPointerDown: undefined, onHandlePointerDown: undefined };

  return (
    <div className="editor-spread" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <NotebookPage ref={leftRef} page={left} side="left" {...common} className={activePageId === left?.id ? "active" : ""} onElementPointerDown={(e, el) => left && onElementPointerDown(left.id, e, el)} onHandlePointerDown={(e, el, h) => left && onHandlePointerDown(left.id, e, el, h)} />
      <NotebookPage ref={rightRef} page={right} side="right" {...common} className={activePageId === right?.id ? "active" : ""} onElementPointerDown={(e, el) => right && onElementPointerDown(right.id, e, el)} onHandlePointerDown={(e, el, h) => right && onHandlePointerDown(right.id, e, el, h)} />
      <div className="gutter" />
    </div>
  );
}
