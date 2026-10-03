import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="desk-texture" />
      <section className="landing-inner">
        <div className="landing-kicker">digital scrapbook · little moments</div>
        <h1>My Little Journal</h1>
        <p>Una libreta digital pensada para escribir, pegar fotografías y guardar recuerdos como un scrapbook físico.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <Link className="landing-link" href="/blog/my-journal">Abrir la libreta →</Link>
          <Link className="landing-link" href="/admin" style={{ background: "transparent", color: "#413c35" }}>Entrar al editor</Link>
        </div>
      </section>
    </main>
  );
}
