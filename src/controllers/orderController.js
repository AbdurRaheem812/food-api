import { createOrder, getMyOrders, getOrderById, updateOrderStatus, getRestaurantOrders, getAllOwnerOrders } from '../services/orderServices.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const createOrderController = asyncHandler(async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const order = await createOrder(req.user.id, parsed.data.deliveryAddress);
  sendSuccess(res, 201, { message: 'Order placed successfully', order });
});

export const getMyOrdersController = asyncHandler(async (req, res) => {
  const orders = await getMyOrders(req.user.id);
  sendSuccess(res, 200, { orders });
});

export const getOrderByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await getOrderById(req.user.id, id, req.user.roles);
  sendSuccess(res, 200, { order });
});

export const updateOrderStatusController = asyncHandler(async (req, res) => {
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { id } = req.params;
  const order = await updateOrderStatus(req.user.id, req.user.roles, id, parsed.data.status, parsed.data.reason);
  sendSuccess(res, 200, { message: `Order status updated to ${order.status}`, order });
});

export const getRestaurantOrdersController = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const orders = await getRestaurantOrders(req.user.id, restaurantId);
  sendSuccess(res, 200, { orders });
});

export const getAllOwnerOrdersController = asyncHandler(async (req, res) => {
  const orders = await getAllOwnerOrders(req.user.id);
  sendSuccess(res, 200, { orders });
});