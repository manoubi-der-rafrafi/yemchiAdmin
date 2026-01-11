// app/page.tsx

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold mb-4">
        Yemchi w Yji — Admin Dashboard
      </h1>

      <p className="text-gray-700 mb-6 text-center max-w-xl">
        Ceci est une simple page Next.js. Tu pourras plus tard y afficher
        les commandes, les utilisateurs, les demandes de transporteurs, etc.
      </p>

      <a
        href="/commande"
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Voir les commandes
      </a>
    </main>
  );
}
