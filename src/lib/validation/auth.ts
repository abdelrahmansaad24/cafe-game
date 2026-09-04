import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const loginSchema = z.object({
  phoneOrEmail: z.string().trim().min(3, "Please enter your WhatsApp phone number or email."),
  password: passwordSchema,
});

export const signupSchema = z.object({
  phone: z.string().trim().min(8, "Please enter a valid WhatsApp phone number."),
  otpCode: z.string().trim().length(6, "Verification code must be 6 digits."),
  password: passwordSchema,
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer.")
    .optional(),
});
