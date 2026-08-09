import { AppError } from './AppError.js';

export const assertRestaurantOwnership = async (prisma, restaurantId, userId) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }
  if (restaurant.userId !== userId) {
    throw new AppError('You do not have permission to manage this restaurant', 403);
  }
  return restaurant;
};

export const assertMenuItemOwnership = async (prisma, userId, menuItemId) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { restaurant: true },
  });
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  if (item.restaurant.userId !== userId) {
    throw new AppError('You do not have permission to manage this menu item', 403);
  }
  return item;
};