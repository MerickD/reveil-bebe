import AdminPanel from "@/components/AdminPanel";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-600"
        >
          ← Retour à l&apos;accueil
        </Link>
        <h1 className="text-2xl font-bold text-violet-800">Administration</h1>
        <p className="mt-1 text-sm text-violet-500">
          Gérez la date et le résultat de la révélation
        </p>
      </header>
      <AdminPanel />
    </div>
  );
}
