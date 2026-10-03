"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace("/admin"); });
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const supabase = getSupabaseBrowser();
    if (!supabase) { router.replace("/admin"); return; }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message); else router.replace("/admin");
    setLoading(false);
  }

  return (
    <main className="login-wrap"><div className="desk-texture" /><section className="login-card">
      <div className="landing-kicker">private editor</div><h1>Open the notebook</h1>
      {!isSupabaseConfigured && <p>Supabase aún no está configurado. Al entrar se abrirá el editor demo con guardado local.</p>}
      <form className="login-form" onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required={isSupabaseConfigured} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" required={isSupabaseConfigured} />
        {error && <p style={{ color: "#8f4d42" }}>{error}</p>}
        <button disabled={loading}>{loading ? "Entrando..." : isSupabaseConfigured ? "Entrar" : "Abrir demo"}</button>
      </form>
      <p style={{ marginTop: 16 }}><Link href="/blog/my-journal" style={{ color: "inherit" }}>← ver la libreta pública</Link></p>
    </section></main>
  );
}
