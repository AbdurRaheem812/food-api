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