import { getCart, addItemToCart, updateCartItemQuantity, removeCartItem, clearCart } from '../services/cartServices.js';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

export const getCartController = asyncHandler(async (req, res) => {
  const result = await getCart(req.user.id);
  sendSuccess(res, 200, result);
});

export const addToCartController = asyncHandler(async (req, res) => {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { replaceCart } = req.body;
  const result = await addItemToCart(req.user.id, parsed.data.menuItemId, parsed.data.quantity, !!replaceCart);
  sendSuccess(res, 200, result);
});

export const updateCartItemController = asyncHandler(async (req, res) => {
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { id } = req.params;
  const result = await updateCartItemQuantity(req.user.id, id, parsed.data.quantity);
  sendSuccess(res, 200, result);
});

export const removeCartItemController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await removeCartItem(req.user.id, id);
  sendSuccess(res, 200, result);
});

export const clearCartController = asyncHandler(async (req, res) => {
  const result = await clearCart(req.user.id);
  sendSuccess(res, 200, result);
});