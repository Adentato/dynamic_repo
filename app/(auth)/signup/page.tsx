'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900">S'inscrire</h2>
          <p className="mt-2 text-zinc-600">
            Créez votre compte Grist-like
          </p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-8 space-y-6">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Mot de passe"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Confirmer le mot de passe"
              />
            </div>
            <Button type="submit" className="w-full">
              S'inscrire
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">ou</span>
            </div>
          </div>

          <p className="text-center text-sm text-zinc-600">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-zinc-900 hover:text-zinc-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
