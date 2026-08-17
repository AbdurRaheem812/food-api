import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError.js';
import { isValidTransition, getTransitionRule } from '../utils/orderStatusMap.js';

const prisma = new PrismaClient();

export const createOrder = async (userId, deliveryAddress) => {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: {
      restaurant: true,
      items: { include: { menuItem: true } },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  if (!cart.restaurant.isOpen) {
    throw new AppError('This restaurant is currently closed', 400);
  }
  if (cart.restaurant.applicationStatus !== 'APPROVED') {
    throw new AppError('This restaurant is not available', 400);
  }

  const unavailable = cart.items.filter((item) => !item.menuItem.isAvailable);
  if (unavailable.length > 0) {
    throw new AppError(
      `Some items are no longer available: ${unavailable.map((i) => i.menuItem.name).join(', ')}`,
      400
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.menuItem.price) * item.quantity, 0);
  const deliveryFee = Number(cart.restaurant.deliveryFee);
  const total = subtotal + deliveryFee;

  if (subtotal < Number(cart.restaurant.minimumOrder)) {
    throw new AppError(
      `Minimum order is ${cart.restaurant.minimumOrder}. Your subtotal is ${subtotal.toFixed(2)}.`,
      400
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        customerId: userId,
        restaurantId: cart.restaurantId,
        subtotal,
        deliveryFee,
        total,
        addressSnapshot: deliveryAddress,
        status: 'PENDING',
        orderItems: {
          create: cart.items.map((item) => ({
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,       
            price: item.menuItem.price,    
            quantity: item.quantity,
            total: Number(item.menuItem.price) * item.quantity,
          })),
        },
        statusHistory: {
          create: { status: 'PENDING' },
        },
      },
      include: { orderItems: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return order;
};

export const getMyOrders = async (userId) => {
  return prisma.order.findMany({
    where: { customerId: userId },
    include: {
      restaurant: { select: { id: true, name: true, logoUrl: true } },
      orderItems: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrderById = async (userId, orderId, userRoles) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: { select: { id: true, name: true, logoUrl: true, userId: true } },
      orderItems: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      customer: { select: { id: true, username: true, phoneNumber: true } },
      review: true,
    },
  });

  if (!order) throw new AppError('Order not found', 404);

  const isCustomerOwner = order.customerId === userId;
  const isRestaurantOwner = order.restaurant.userId === userId;

  if (!isCustomerOwner && !isRestaurantOwner) {
    throw new AppError('You do not have permission to view this order', 403);
  }

  return order;
};

export const updateOrderStatus = async (userId, userRoles, orderId, newStatus, reason) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  const rule = getTransitionRule(newStatus);
  if (!rule) throw new AppError('Invalid status', 400);

  const isRestaurantOwner = order.restaurant.userId === userId;
  const isOrderCustomer = order.customerId === userId;

  const hasRoleForTransition = rule.allowedRoles.some((role) => userRoles.includes(role));
  const isCorrectParty =
    (rule.allowedRoles.includes('OWNER') && isRestaurantOwner) ||
    (rule.allowedRoles.includes('CUSTOMER') && isOrderCustomer);

  if (!hasRoleForTransition || !isCorrectParty) {
    throw new AppError('You do not have permission to make this change', 403);
  }

  if (!isValidTransition(order.status, newStatus)) {
    throw new AppError(`Cannot move an order from ${order.status} to ${newStatus}`, 400);
  }

  if (rule.requiresReason && !reason) {
    throw new AppError('A reason is required for this action', 400);
  }

  const updated = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: newStatus,
    rejectionReason: newStatus === 'REJECTED' ? reason : undefined,
    statusHistory: { create: { status: newStatus } },
  },
  include: { orderItems: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
});

  return updated;
};

export const getRestaurantOrders = async (userId, restaurantId) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (restaurant.userId !== userId) throw new AppError('You do not have permission to view these orders', 403);

  return prisma.order.findMany({
    where: { restaurantId },
    include: {
      customer: { select: { id: true, username: true, phoneNumber: true } },
      orderItems: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getAllOwnerOrders = async (userId) => {
  const restaurants = await prisma.restaurant.findMany({ where: { userId }, select: { id: true } });
  const restaurantIds = restaurants.map((r) => r.id);

  return prisma.order.findMany({
    where: { restaurantId: { in: restaurantIds } },
    include: {
      customer: { select: { id: true, username: true, phoneNumber: true } },
      restaurant: { select: { id: true, name: true } },
      orderItems: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};