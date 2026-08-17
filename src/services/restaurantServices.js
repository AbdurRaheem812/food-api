import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError.js';
import { assertRestaurantOwnership } from '../utils/assertOwnership.js';
import { streamUpload } from '../utils/cloudinaryUpload.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const prisma = new PrismaClient();

export const applyAsRestaurantOwner = async (userId, data) => {
  const restaurant = await prisma.restaurant.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      address: data.address,
      deliveryFee: data.deliveryFee,
      minimumOrder: data.minimumOrder,
      openTime: new Date(`1970-01-01T${data.openTime}:00Z`),
      closeTime: new Date(`1970-01-01T${data.closeTime}:00Z`),
      applicationStatus: 'PENDING',
      restaurantCuisines: {
        create: data.cuisines.map((name) => ({
          cuisine: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
    include: { restaurantCuisines: { include: { cuisine: true } } },
  });
  return restaurant;
};

export const uploadRestaurantLogo = async (userId, restaurantId, fileBuffer) => {
  const restaurant = await assertRestaurantOwnership(prisma, restaurantId, userId);
  const result = await streamUpload(fileBuffer, 'foodhub/restaurant-logos');
  return prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { logoUrl: result.secure_url },
  });
};

export const getMyRestaurants = async (userId) => {
  return prisma.restaurant.findMany({
    where: { userId },
    select: { id: true, name: true, applicationStatus: true, rejectionReason: true, logoUrl: true, isOpen: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateRestaurant = async (userId, restaurantId, data) => {
 const restaurant = await assertRestaurantOwnership(prisma, restaurantId, userId);

  const updateData = { ...data };
  if (data.openTime) updateData.openTime = new Date(`1970-01-01T${data.openTime}:00Z`);
  if (data.closeTime) updateData.closeTime = new Date(`1970-01-01T${data.closeTime}:00Z`);
  if (data.cuisines) {
    updateData.restaurantCuisines = {
      deleteMany: {},
      create: data.cuisines.map((name) => ({
        cuisine: { connectOrCreate: { where: { name }, create: { name } } },
      })),
    };
  }
  delete updateData.cuisines;

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: updateData,
    include: { restaurantCuisines: { include: { cuisine: true } } },
  });
};

export const toggleOpenStatus = async (userId, restaurantId) => {
  const restaurant = await assertRestaurantOwnership(prisma, restaurantId, userId);
  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: { isOpen: !restaurant.isOpen },
  });
};

export const getPublicRestaurants = async (query) => {
  const { search, cuisine, sort } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = {
    applicationStatus: 'APPROVED',
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(cuisine && {
      restaurantCuisines: {
        some: { cuisine: { name: { equals: cuisine, mode: 'insensitive' } } },
      },
    }),
  };

  const sortMap = {
    newest: { createdAt: 'desc' },
    name: { name: 'asc' },
    deliveryFee: { deliveryFee: 'asc' },
  };

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy: sortMap[sort],
      skip,
      take: limit,
      include: { restaurantCuisines: { include: { cuisine: true } } },
    }),
    prisma.restaurant.count({ where }),
  ]);

  return { restaurants, meta: buildPaginationMeta(page, limit, total) };
};

export const getPublicRestaurantById = async (restaurantId) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { restaurantCuisines: { include: { cuisine: true } } },
  });

  if (!restaurant || restaurant.applicationStatus !== 'APPROVED') {
    throw new AppError('Restaurant not found', 404);
  }

  return restaurant;
};