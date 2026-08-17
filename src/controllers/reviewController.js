import { createReview, getRestaurantReviews } from '../services/reviewServices.js';
import { createReviewSchema } from '../validators/review.schema.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const createReviewController = asyncHandler(async (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { orderId } = req.params;
  const review = await createReview(req.user.id, orderId, parsed.data.rating, parsed.data.comment);
  sendSuccess(res, 201, { message: 'Review submitted', review });
});

export const getRestaurantReviewsController = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const result = await getRestaurantReviews(restaurantId);
  sendSuccess(res, 200, result);
});