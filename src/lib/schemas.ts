import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

export const registerSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().min(1).email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

export const teamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sportId: z.string().optional(),
});

export const profileNameSchema = z.object({
  name: z.string().optional(),
});

export const profilePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type TeamValues = z.infer<typeof teamSchema>;
export type ProfileNameValues = z.infer<typeof profileNameSchema>;
export type ProfilePasswordValues = z.infer<typeof profilePasswordSchema>;
