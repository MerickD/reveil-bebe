import AdminPanel from "@/components/AdminPanel";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="text-center">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#a890c0] hover:text-[var(--color-floral-rose)]"
        >
          ← Retour à l&apos;accueil
        </Link>
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#a890c0] shadow-sm ring-1 ring-[#e0d4f0]">
          <span className="text-base">🔐</span> Espace privé
        </p>
        <h1 className="font-scratch text-3xl text-[#5c4f56] sm:text-4xl">
          Administration
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#8a7d84]">
          Gérez la révélation, le résultat et le jeu du prénom
        </p>
      </header>

      <div className="glass-card rounded-[1.75rem] p-5 sm:p-7">
        <AdminPanel />
      </div>
    </div>
  );
}
