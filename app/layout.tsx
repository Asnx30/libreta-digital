import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Little Journal",
  description: "A cozy interactive scrapbook journal.",
  openGraph: {
    title: "My Little Journal",
    description: "A cozy interactive scrapbook journal.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <div className="desk-texture" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
