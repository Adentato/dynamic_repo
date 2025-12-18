import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, {
    message: 'Le nom du workspace doit contenir au moins 2 caractères.',
  }),
  slug: z
    .string()
    .min(2, {
      message: 'Le slug doit contenir au moins 2 caractères.',
    })
    .regex(/^[a-z0-9-]+$/, {
      message:
        'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets.',
    }),
  description: z.string().default(''),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
