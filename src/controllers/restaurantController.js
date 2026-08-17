import { applyAsRestaurantOwner, uploadRestaurantLogo, getMyApplicationStatus } from '../services/restaurantServices.js';
import { createRestaurantSchema } from '../validators/restaurant.schema.js';
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
  const restaurant = await uploadRestaurantLogo(req.user.id, req.file.buffer);
  sendSuccess(res, 200, { message: 'Logo uploaded successfully', restaurant });
});

export const getApplicationStatusController = asyncHandler(async (req, res) => {
    const restaurant = await getMyApplicationStatus(req.user.id);
    sendSuccess(res, 200, { restaurant });
});