import * as z from 'zod';

export const createOrderSchema = z.object({
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  reason: z.string().optional(),
});