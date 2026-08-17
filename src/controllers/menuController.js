import {
  createCategory, getCategoriesForRestaurant,
  createMenuItem, getMenuForRestaurant, updateMenuItem,
  toggleMenuItemAvailability, uploadMenuItemImage, deleteMenuItem
 } from '../services/menuServices.js';
import { createCategorySchema, createMenuItemSchema, updateMenuItemSchema } from '../validators/menu.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const createCategoryController = asyncHandler(async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { restaurantId } = req.params;
  const item = await createCategory(req.user.id, restaurantId, parsed.data);
  sendSuccess(res, 201, { message: 'Category created', item });
});

export const getCategoriesController = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const categories = await getCategoriesForRestaurant(restaurantId);
  sendSuccess(res, 200, { categories });
});

export const createMenuItemController = asyncHandler(async (req, res) => {
  const parsed = createMenuItemSchema.safeParse({
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    isVeg: req.body.isVeg === 'true' || req.body.isVeg === true,
  });
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { restaurantId } = req.params;
  const item = await createMenuItem(req.user.id, restaurantId, parsed.data);
  sendSuccess(res, 201, { message: 'Menu item created', item });
});

export const getMenuController = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const items = await getMenuForRestaurant(restaurantId);
  sendSuccess(res, 200, { items });
});

export const updateMenuItemController = asyncHandler(async (req, res) => {
  const parsed = updateMenuItemSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { id } = req.params;
  const item = await updateMenuItem(req.user.id, id, parsed.data);
  sendSuccess(res, 200, { message: 'Menu item updated', item });
});

export const toggleAvailabilityController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await toggleMenuItemAvailability(req.user.id, id);
  sendSuccess(res, 200, { message: `Item is now ${item.isAvailable ? 'available' : 'unavailable'}`, item });
});

export const uploadMenuItemImageController = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded. Field name must be "image".', 400);
  const { id } = req.params;
  const item = await uploadMenuItemImage(req.user.id, id, req.file.buffer);
  sendSuccess(res, 200, { message: 'Image uploaded successfully', item });
});

export const deleteMenuItemController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteMenuItem(req.user.id, id);
  sendSuccess(res, 200, result);
});