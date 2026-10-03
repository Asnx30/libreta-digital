import { AuthGate } from "@/components/editor/AuthGate";
import { NotebookEditor } from "@/components/editor/NotebookEditor";

export default function AdminPage() {
  return <AuthGate><NotebookEditor /></AuthGate>;
}
