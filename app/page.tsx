import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-zinc-900">Grist-like</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/signup">
                <Button>S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
            Construisez votre base de données personnalisée
          </h2>
          <p className="mt-6 text-xl text-zinc-600 max-w-3xl mx-auto">
            Grist-like est une plateforme puissante pour créer et gérer vos données sans avoir besoin de coder.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg">
                Commencer maintenant
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg">
                En savoir plus
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-zinc-900">Facile à utiliser</h3>
            <p className="mt-2 text-zinc-600">
              Créez des tables, configurez les champs et gérez vos données en quelques clics.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-zinc-900">Collaboratif</h3>
            <p className="mt-2 text-zinc-600">
              Partagez vos bases de données avec vos équipes et collaborez en temps réel.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-zinc-900">Sécurisé</h3>
            <p className="mt-2 text-zinc-600">
              Vos données sont chiffrées et sauvegardées de manière sécurisée dans le cloud.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
