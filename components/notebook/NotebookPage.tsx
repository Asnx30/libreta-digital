"use client";

import { forwardRef } from "react";
import type { JournalPage } from "@/types/journal";
import { CanvasElement } from "@/components/notebook/CanvasElement";

export const NotebookPage = forwardRef<HTMLDivElement, {
  page?: JournalPage;
  side?: "left" | "right";
  editable?: boolean;
  selectedId?: string | null;
  onElementPointerDown?: React.ComponentProps<typeof CanvasElement>["onPointerDown"];
  onHandlePointerDown?: React.ComponentProps<typeof CanvasElement>["onHandlePointerDown"];
  className?: string;
}>(({ page, side = "right", editable = false, selectedId, onElementPointerDown, onHandlePointerDown, className = "" }, ref) => (
  <div ref={ref} className={`page ${side} ${page?.background || "paper-cream"} ${className}`}>
    <div className="page-inner">
      {page ? page.elements.slice().sort((a, b) => a.z_index - b.z_index).map((element) => (
        <CanvasElement key={element.id} element={element} interactive={editable} selected={selectedId === element.id} onPointerDown={onElementPointerDown} onHandlePointerDown={onHandlePointerDown} />
      )) : <div className="empty-page">blank page</div>}
    </div>
  </div>
));
NotebookPage.displayName = "NotebookPage";
