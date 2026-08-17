import * as z from 'zod';

export const addToCartSchema = z.object({
  menuItemId: z.string().min(1, 'menuItemId is required'),
  quantity: z.number().int().positive().optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1'),
});