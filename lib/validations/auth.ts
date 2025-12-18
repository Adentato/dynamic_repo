import { z } from 'zod'

export const signUpSchema = z
  .object({
    full_name: z.string().min(2, {
      message: 'Le nom doit contenir au moins 2 caractères.',
    }),
    email: z.string().email({
      message: 'Veuillez entrer une adresse email valide.',
    }),
    password: z.string().min(8, {
      message: 'Le mot de passe doit contenir au moins 8 caractères.',
    }),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm_password'],
  })

export const signInSchema = z.object({
  email: z.string().email({
    message: 'Veuillez entrer une adresse email valide.',
  }),
  password: z.string().min(1, {
    message: 'Le mot de passe est requis.',
  }),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
