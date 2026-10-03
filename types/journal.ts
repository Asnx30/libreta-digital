export type BackgroundId =
  | "paper-cream"
  | "paper-white"
  | "paper-warm"
  | "paper-grid"
  | "paper-dots"
  | "paper-speckle";

export type ElementType = "text" | "image" | "paper" | "decoration";

export interface JournalElement {
  id: string;
  page_id: string;
  type: ElementType;
  content?: string | null;
  asset_url?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  font_family?: string | null;
  font_size?: number | null;
  font_weight?: number | null;
  color?: string | null;
  opacity: number;
  style?: Record<string, unknown>;
}

export interface JournalPage {
  id: string;
  notebook_id: string;
  page_index: number;
  background: BackgroundId;
  settings?: Record<string, unknown>;
  elements: JournalElement[];
}

export interface Notebook {
  id: string;
  owner_id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  cover_config?: Record<string, unknown>;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  pages: JournalPage[];
}
