import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError.js';

const prisma = new PrismaClient();

export const createReview = async (userId, orderId, rating, comment) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { review: true } });
  if (!order) throw new AppError('Order not found', 404);
  if (order.customerId !== userId) throw new AppError('You do not have permission to review this order', 403);
  if (order.status !== 'DELIVERED') throw new AppError('You can only review delivered orders', 400);
  if (order.review) throw new AppError('You have already reviewed this order', 409);

  return prisma.review.create({
    data: {
      orderId,
      customerId: userId,
      restaurantId: order.restaurantId,
      rating,
      comment,
    },
  });
};

export const getRestaurantReviews = async (restaurantId) => {
  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { restaurantId, isHidden: false },
      include: { customer: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.aggregate({
      where: { restaurantId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return {
    reviews,
    avgRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
    reviewCount: aggregate._count,
  };
};