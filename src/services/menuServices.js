import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError.js';
import { assertRestaurantOwnership, assertMenuItemOwnership } from '../utils/assertOwnership.js';
import { streamUpload } from '../utils/cloudinaryUpload.js';

const prisma = new PrismaClient();

// ---- Categories ----

export const createCategory = async (userId, restaurantId, data) => {
  await assertRestaurantOwnership(prisma, restaurantId, userId);
  return prisma.menuCategory.create({
    data: { name: data.name, restId: restaurantId },
  });
};

export const getCategoriesForRestaurant = async (restaurantId) => {
  return prisma.menuCategory.findMany({
    where: { restId: restaurantId },
    orderBy: { createdAt: 'asc' },
  });
};

// ---- Menu Items ----

export const createMenuItem = async (userId, restaurantId, data) => {
  await assertRestaurantOwnership(prisma, restaurantId, userId);
  return prisma.menuItem.create({
    data: {
      restId: restaurantId,
      categoryId: data.categoryId || null,
      name: data.name,
      description: data.description,
      price: data.price,
      isVeg: data.isVeg,
    },
  });
};

export const getMenuForRestaurant = async (restaurantId) => {
  return prisma.menuItem.findMany({
    where: { restId: restaurantId },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });
};

export const updateMenuItem = async (userId, menuItemId, data) => {
  await assertMenuItemOwnership(prisma, userId, menuItemId);
  return prisma.menuItem.update({
    where: { id: menuItemId },
    data,
  });
};

export const toggleMenuItemAvailability = async (userId, menuItemId) => {
  const item = await assertMenuItemOwnership(prisma, userId, menuItemId);
  return prisma.menuItem.update({
    where: { id: menuItemId },
    data: { isAvailable: !item.isAvailable },
  });
};

export const uploadMenuItemImage = async (userId, menuItemId, fileBuffer) => {
  await assertMenuItemOwnership(prisma, userId, menuItemId);
  const result = await streamUpload(fileBuffer, 'foodhub/menu-items');
  return prisma.menuItem.update({
    where: { id: menuItemId },
    data: { imageUrl: result.secure_url },
  });
};

export const deleteMenuItem = async (userId, menuItemId) => {
  await assertMenuItemOwnership(prisma, userId, menuItemId);
  await prisma.menuItem.delete({ where: { id: menuItemId } });
  return { message: 'Menu item deleted successfully' };
};