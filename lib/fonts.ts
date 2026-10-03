export const allFonts = [
  "Caveat",
  "Dancing Script",
  "Patrick Hand",
  "Shadows Into Light",
  "Architects Daughter",
  "Playfair Display",
  "Courier Prime",
  "Inter",
] as const;

export type FontName = (typeof allFonts)[number];
