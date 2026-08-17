import * as z from 'zod';

export const createRestaurantSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    address: z.string().min(3),
    deliveryFee: z.number().nonnegative(),
    minimumOrder: z.number().nonnegative(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/, 'openTime must be in HH:MM format'),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'closeTime must be in HH:MM format'),
    cuisines: z.array(z.string()).min(1, 'Select at least one cuisine'),
});

export const updateRestaurantSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    address: z.string().min(3).optional(),
    deliveryFee: z.number().nonnegative().optional(),
    minimumOrder: z.number().nonnegative().optional(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/, 'openTime must be in HH:MM format').optional(),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'closeTime must be in HH:MM format').optional(),
    cuisines: z.array(z.string()).min(1).optional(),
});

export const listRestaurantsQuerySchema = z.object({
  search: z.string().optional(),
  cuisine: z.string().optional(),
  sort: z.enum(['newest', 'name', 'deliveryFee']).optional().default('newest'),
  page: z.string().optional(),
  limit: z.string().optional(),
});