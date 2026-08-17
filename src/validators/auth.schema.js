import * as z from 'zod';

export const registerSchema = z.object({
    username: z.string(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["CUSTOMER", "OWNER"]).default("CUSTOMER")
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});