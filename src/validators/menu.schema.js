import * as z from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  isVeg: z.boolean().optional().default(false),
  categoryId: z.string().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();