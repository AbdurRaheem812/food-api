import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

const prisma = new PrismaClient();

const assertCartItemOwnership = async (userId, cartItemId) => {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });
  if (!item) throw new AppError('Cart item not found', 404);
  if (item.cart.customerId !== userId) throw new AppError('You do not have permission to modify this cart', 403);
  return item;
};

export const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: {
      restaurant: { select: { id: true, name: true, logoUrl: true, deliveryFee: true, minimumOrder: true, isOpen: true } },
      items: { include: { menuItem: true } },
    },
  });

  if (!cart) {
    return { cart: null, items: [], subtotal: 0 };
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.menuItem.price) * item.quantity, 0);
  return { cart, items: cart.items, subtotal };
};

export const addItemToCart = async (userId, menuItemId, quantity, replaceCart = false) => {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { restaurant: true },
  });
  if (!menuItem) throw new AppError('Menu item not found', 404);
  if (!menuItem.isAvailable) throw new AppError('This item is currently unavailable', 400);
  if (menuItem.restaurant.applicationStatus !== 'APPROVED') throw new AppError('This restaurant is not available', 400);

  let cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: { _count: { select: { items: true } } },
  });

  const cartHasItems = cart && cart._count.items > 0;

  if (cartHasItems && cart.restaurantId !== menuItem.restId) {
    if (!replaceCart) {
      throw new AppError(
        'Your cart contains items from a different restaurant. Clear your cart to order from this restaurant instead.',
        409
      );
    }
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  if (cart && cart.restaurantId !== menuItem.restId) {
    cart = await prisma.cart.update({ where: { id: cart.id }, data: { restaurantId: menuItem.restId } });
  }

  if (!cart) {
    cart = await prisma.cart.create({ data: { customerId: userId, restaurantId: menuItem.restId } });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_menuItemId: { cartId: cart.id, menuItemId } },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, menuItemId, quantity } });
  }

  return getCart(userId);
};

export const updateCartItemQuantity = async (userId, cartItemId, quantity) => {
  await assertCartItemOwnership(userId, cartItemId);
  await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  return getCart(userId);
};

export const removeCartItem = async (userId, cartItemId) => {
  await assertCartItemOwnership(userId, cartItemId);
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  return getCart(userId);
};

export const clearCart = async (userId) => {
  await prisma.cartItem.deleteMany({
    where: { cart: { customerId: userId } },
  });
  return { message: 'Cart cleared' };
};