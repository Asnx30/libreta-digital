"use client";

import type { Notebook } from "@/types/journal";
import { PageFlipBook } from "@/components/notebook/PageFlipBook";

export function PublicNotebook({ notebook }: { notebook: Notebook }) {
  return (
    <main className="page-shell">
      <div className="desk-texture" />
      <header className="public-header">
        <div className="public-title">{notebook.title}</div>
        <div className="public-badge">{notebook.subtitle || "little moments"}</div>
      </header>
      <PageFlipBook pages={notebook.pages} />
    </main>
  );
}
