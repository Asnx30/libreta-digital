"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { JournalPage } from "@/types/journal";
import { NotebookPage } from "@/components/notebook/NotebookPage";

export function PageFlipBook({ pages }: { pages: JournalPage[] }) {
  const ordered = useMemo(() => [...pages].sort((a, b) => a.page_index - b.page_index), [pages]);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [busy, setBusy] = useState(false);

  const canNext = spreadIndex + 2 < ordered.length;
  const canPrev = spreadIndex > 0;

  const turn = useCallback((next: boolean) => {
    if (busy || (next && !canNext) || (!next && !canPrev)) return;
    setDirection(next ? "next" : "prev");
    setBusy(true);
    window.setTimeout(() => {
      setSpreadIndex((value) => next ? Math.min(value + 2, Math.max(ordered.length - 1, 0)) : Math.max(value - 2, 0));
      setDirection(null);
      setBusy(false);
    }, 780);
  }, [busy, canNext, canPrev, ordered.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") turn(true);
      if (event.key === "ArrowLeft") turn(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  const currentLeft = ordered[spreadIndex];
  const currentRight = ordered[spreadIndex + 1];
  const nextLeft = ordered[spreadIndex + 2];
  const prevRight = ordered[Math.max(spreadIndex - 1, 0)];

  return (
    <div className="book-wrap">
      <div className="book-stage">
        <div className="spread">
          <NotebookPage page={currentLeft} side="left" />
          <NotebookPage page={currentRight} side="right" />
        </div>
        <div className={`flip-clip next ${direction === "next" ? "flipping" : ""}`}>
          <div className={`flip-layer ${direction === "next" ? "flipping-next" : ""}`}>
            <div className="flip-shadow"><NotebookPage page={currentRight} side="right" /></div>
            <div className="flip-back"><NotebookPage page={nextLeft} side="left" /></div>
          </div>
        </div>
        <div className={`flip-clip prev ${direction === "prev" ? "flipping" : ""}`}>
          <div className={`flip-layer ${direction === "prev" ? "flipping-prev" : ""}`}>
            <div className="flip-shadow"><NotebookPage page={currentLeft} side="left" /></div>
            <div className="flip-back"><NotebookPage page={prevRight} side="right" /></div>
          </div>
        </div>
        <div className="gutter" />
        <button className="page-zone left-zone" aria-label="Página anterior" disabled={!canPrev || busy} onClick={() => turn(false)} />
        <button className="page-zone right-zone" aria-label="Página siguiente" disabled={!canNext || busy} onClick={() => turn(true)} />
      </div>
      <div className="book-controls">
        <button className="book-btn" onClick={() => turn(false)} disabled={!canPrev || busy}>←</button>
        <div className="page-counter">{Math.min(spreadIndex + 1, ordered.length)} — {Math.min(spreadIndex + 2, ordered.length)}</div>
        <button className="book-btn" onClick={() => turn(true)} disabled={!canNext || busy}>→</button>
      </div>
    </div>
  );
}
