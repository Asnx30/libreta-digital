import { notFound } from "next/navigation";
import { PublicNotebook } from "@/components/PublicNotebook";
import { cloneDemoNotebook } from "@/lib/demo-data";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import type { JournalPage, Notebook } from "@/types/journal";

export const dynamic = "force-dynamic";

type DbElement = JournalPage["elements"][number];

async function getNotebook(slug: string): Promise<Notebook | null> {
  if (!isSupabaseConfigured) return slug === "my-journal" ? cloneDemoNotebook() : null;
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: notebook, error } = await supabase.from("notebooks").select("*").eq("slug", slug).eq("is_public", true).maybeSingle();
  if (error || !notebook) return slug === "my-journal" ? cloneDemoNotebook() : null;

  const { data: pages, error: pageError } = await supabase.from("pages").select("*").eq("notebook_id", notebook.id).order("page_index", { ascending: true });
  if (pageError) return null;

  const pageIds = (pages || []).map((p) => p.id);
  let elements: DbElement[] = [];
  if (pageIds.length) {
    const { data, error: elementError } = await supabase.from("elements").select("*").in("page_id", pageIds).order("z_index", { ascending: true });
    if (elementError) return null;
    elements = (data || []) as DbElement[];
  }

  const resultPages: JournalPage[] = (pages || []).map((page) => ({ ...page, elements: elements.filter((element) => element.page_id === page.id) })) as JournalPage[];
  return { ...notebook, pages: resultPages } as Notebook;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notebook = await getNotebook(slug);
  return { title: notebook?.title || "Journal", description: notebook?.subtitle || "A cozy digital scrapbook journal.", openGraph: { title: notebook?.title || "Journal", description: notebook?.subtitle || "A cozy digital scrapbook journal." } };
}

export default async function PublicBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notebook = await getNotebook(slug);
  if (!notebook) notFound();
  return <PublicNotebook notebook={notebook} />;
}
