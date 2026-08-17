import { applyAsRestaurantOwner, uploadRestaurantLogo, getMyRestaurants, updateRestaurant, toggleOpenStatus, getPublicRestaurants, getPublicRestaurantById } from '../services/restaurantServices.js';
import { createRestaurantSchema, updateRestaurantSchema, listRestaurantsQuerySchema } from '../validators/restaurant.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const applyController = asyncHandler(async (req, res) => {
    const parsed = createRestaurantSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError('Validation error', 400, parsed.error.issues);
    }
    const restaurant = await applyAsRestaurantOwner(req.user.id, parsed.data);
    sendSuccess(res, 201, { message: 'Restaurant application submitted. Awaiting approval.', restaurant });
});

export const uploadLogoController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded. Field name must be "logo".', 400);
  }
  const { id } = req.params;
  const restaurant = await uploadRestaurantLogo(req.user.id, id, req.file.buffer);
  sendSuccess(res, 200, { message: 'Logo uploaded successfully', restaurant });
});

export const getMyRestaurantsController = asyncHandler(async (req, res) => {
    const restaurants = await getMyRestaurants(req.user.id);
    sendSuccess(res, 200, { restaurants });
});

export const updateRestaurantController = asyncHandler(async (req, res) => {
    const parsed = updateRestaurantSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError('Validation error', 400, parsed.error.issues);
    }
    const { id } = req.params;
    const restaurant = await updateRestaurant(req.user.id, id, parsed.data);
    sendSuccess(res, 200, { message: 'Restaurant updated successfully', restaurant });
});

export const toggleOpenController = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const restaurant = await toggleOpenStatus(req.user.id, id);
    sendSuccess(res, 200, { message: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`, restaurant });
});

export const getPublicRestaurantsController = asyncHandler(async (req, res) => {
  const parsed = listRestaurantsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query parameters', 400, parsed.error.issues);

  const { restaurants, meta } = await getPublicRestaurants(parsed.data);
  sendSuccess(res, 200, { restaurants, meta });
});

export const getPublicRestaurantByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurant = await getPublicRestaurantById(id);
  sendSuccess(res, 200, { restaurant });
});