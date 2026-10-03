import type { JournalElement, JournalPage, Notebook } from "@/types/journal";
import { uid } from "@/lib/utils";

function el(partial: Omit<JournalElement, "id" | "page_id" | "opacity"> & { opacity?: number }): Omit<JournalElement, "id" | "page_id"> {
  return { opacity: 1, ...partial };
}

function buildPages(): Array<{ background: JournalPage["background"]; elements: Array<Omit<JournalElement, "id" | "page_id">> }> {
  return [
    {
      background: "paper-cream",
      elements: [
        el({ type: "text", content: "my little journal", x: 10, y: 10, width: 70, height: 16, rotation: -1.2, z_index: 1, font_family: "Playfair Display", font_size: 8.5, font_weight: 600, color: "#4a4038", style: { textAlign: "left" } }),
        el({ type: "decoration", content: "flower", x: 76, y: 8, width: 14, height: 14, rotation: 6, z_index: 2, color: "#8a6b4e" }),
        el({ type: "paper", content: "Hoy empiezo esta libreta para guardar los pequeños momentos del día a día. Fotos, notas, recortes... un poquito de todo.", x: 14, y: 32, width: 56, height: 34, rotation: -1.6, z_index: 3, font_family: "Caveat", font_size: 5.6, font_weight: 400, color: "#504a44" }),
        el({ type: "decoration", content: "tape", x: 30, y: 24, width: 26, height: 7, rotation: -3, z_index: 4, color: "#d3c0a0" }),
        el({ type: "decoration", content: "star", x: 78, y: 70, width: 11, height: 11, rotation: 10, z_index: 2, color: "#8a6b4e" }),
      ],
    },
    {
      background: "paper-dots",
      elements: [
        el({ type: "image", content: "polaroid", asset_url: "/demo/photo-mountain.png", x: 14, y: 14, width: 52, height: 46, rotation: -3.5, z_index: 2, style: { caption: "una mañana de montaña" } }),
        el({ type: "decoration", content: "clip", x: 38, y: 10, width: 10, height: 10, rotation: 0, z_index: 3, color: "#756c61" }),
        el({ type: "text", content: "pequeños\nmomentos", x: 68, y: 54, width: 28, height: 26, rotation: 2.4, z_index: 1, font_family: "Dancing Script", font_size: 7.2, font_weight: 600, color: "#4e4841", style: { textAlign: "left" } }),
      ],
    },
    {
      background: "paper-warm",
      elements: [
        el({ type: "image", content: "torn", asset_url: "/demo/photo-sunset.png", x: 22, y: 10, width: 58, height: 44, rotation: 2.2, z_index: 1 }),
        el({ type: "paper", content: "atardecer de domingo, con calma y un café caliente.", x: 16, y: 58, width: 58, height: 26, rotation: -1, z_index: 2, font_family: "Patrick Hand", font_size: 5, font_weight: 400, color: "#514a43" }),
        el({ type: "decoration", content: "tape", x: 44, y: 6, width: 24, height: 7, rotation: 4, z_index: 3, color: "#d3c0a0" }),
      ],
    },
    {
      background: "paper-dots",
      elements: [
        el({ type: "image", content: "polaroid", asset_url: "/demo/photo-flowers.png", x: 12, y: 10, width: 42, height: 56, rotation: -2.8, z_index: 1, style: { caption: "flores de abril" } }),
        el({ type: "paper", content: "Hoy el jardín olía a lluvia reciente. Me quedé un rato mirando las florecitas blancas entre la hierba.", x: 58, y: 20, width: 32, height: 38, rotation: 1.4, z_index: 2, font_family: "Caveat", font_size: 5.4, font_weight: 400, color: "#504a44" }),
        el({ type: "decoration", content: "tape", x: 30, y: 6, width: 22, height: 7, rotation: -2, z_index: 3, color: "#d3c0a0" }),
        el({ type: "decoration", content: "flower", x: 70, y: 66, width: 12, height: 12, rotation: -5, z_index: 2, color: "#8a6b4e" }),
      ],
    },
    {
      background: "paper-grid",
      elements: [
        el({ type: "text", content: "lista de pequeñas alegrías:\n— café de la mañana\n— luz entrando por la ventana\n— una canción nueva\n— mensajes de buenas noches", x: 14, y: 14, width: 68, height: 50, rotation: -0.8, z_index: 1, font_family: "Architects Daughter", font_size: 4.6, font_weight: 400, color: "#45403a", style: { textAlign: "left", lineHeight: 1.7 } }),
        el({ type: "decoration", content: "star", x: 74, y: 68, width: 12, height: 12, rotation: -8, z_index: 2, color: "#8a6b4e" }),
      ],
    },
  ];
}

export function cloneDemoNotebook(): Notebook {
  const notebookId = uid("notebook");
  const pages: JournalPage[] = buildPages().map((page, index) => {
    const pageId = uid("page");
    return {
      id: pageId,
      notebook_id: notebookId,
      page_index: index,
      background: page.background,
      settings: {},
      elements: page.elements.map((element) => ({ ...element, id: uid("el"), page_id: pageId })),
    };
  });

  return {
    id: notebookId,
    slug: "my-journal",
    title: "My Little Journal",
    subtitle: "little moments",
    cover_config: {},
    is_public: true,
    pages,
  };
}
