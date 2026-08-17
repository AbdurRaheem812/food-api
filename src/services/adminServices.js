import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const prisma = new PrismaClient();

export const getPendingApplications = async () => {
  return prisma.restaurant.findMany({
    where: { applicationStatus: 'PENDING' },
    include: { owner: { select: { username: true, email: true } }, restaurantCuisines: { include: { cuisine: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

export const decideApplication = async (restaurantId, decision, reason) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (restaurant.applicationStatus !== 'PENDING') throw new AppError('This application has already been decided', 400);

  if (decision === 'REJECTED' && !reason) throw new AppError('A rejection reason is required', 400);

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      applicationStatus: decision,
      rejectionReason: decision === 'REJECTED' ? reason : null,
    },
  });
};

export const getUsers = async (query) => {
  const { search } = query;
  const { page, limit, skip } = parsePagination(query, 20);

  const where = search
    ? { OR: [{ username: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, username: true, email: true, isBlocked: true, createdAt: true, userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, meta: buildPaginationMeta(page, limit, total) };
};

export const toggleUserBlock = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.user.update({ where: { id: userId }, data: { isBlocked: !user.isBlocked } });
};

export const hideReview = async (reviewId) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError('Review not found', 404);
  return prisma.review.update({ where: { id: reviewId }, data: { isHidden: !review.isHidden } });
};

export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalRestaurants,
    pendingApplications,
    totalOrders,
    revenueAgg,
    ordersByStatus,
    topRestaurants,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.restaurant.count({ where: { applicationStatus: 'APPROVED' } }),
    prisma.restaurant.count({ where: { applicationStatus: 'PENDING' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['restaurantId'],
      where: { status: 'DELIVERED' },
      _count: true,
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  const restaurantIds = topRestaurants.map((r) => r.restaurantId);
  const restaurantNames = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(restaurantNames.map((r) => [r.id, r.name]));

  return {
    totalUsers,
    totalRestaurants,
    pendingApplications,
    totalOrders,
    totalRevenue: Number(revenueAgg._sum.total || 0),
    ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count })),
    topRestaurants: topRestaurants.map((r) => ({
      id: r.restaurantId,
      name: nameMap[r.restaurantId],
      orderCount: r._count,
      revenue: Number(r._sum.total),
    })),
  };
};