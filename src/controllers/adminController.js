import * as adminServices from '../services/adminServices.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as z from 'zod';

const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

export const getPendingApplicationsController = asyncHandler(async (req, res) => {
  const restaurants = await adminServices.getPendingApplications();
  sendSuccess(res, 200, { restaurants });
});

export const decideApplicationController = asyncHandler(async (req, res) => {
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Validation error', 400, parsed.error.issues);
  const { id } = req.params;
  const restaurant = await adminServices.decideApplication(id, parsed.data.decision, parsed.data.reason);
  sendSuccess(res, 200, { message: `Application ${parsed.data.decision.toLowerCase()}`, restaurant });
});

export const getUsersController = asyncHandler(async (req, res) => {
  const result = await adminServices.getUsers(req.query);
  sendSuccess(res, 200, result);
});

export const toggleUserBlockController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await adminServices.toggleUserBlock(id);
  sendSuccess(res, 200, { message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
});

export const hideReviewController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await adminServices.hideReview(id);
  sendSuccess(res, 200, { message: `Review ${review.isHidden ? 'hidden' : 'unhidden'}`, review });
});

export const getPlatformStatsController = asyncHandler(async (req, res) => {
  const stats = await adminServices.getPlatformStats();
  sendSuccess(res, 200, { stats });
});