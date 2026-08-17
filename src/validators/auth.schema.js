import * as z from 'zod';

export const registerSchema = z.object({
    username: z.string(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string(),
});