import { Router } from 'express';
import { createReviewController, getRestaurantReviewsController } from '../controllers/reviewController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';

const router = Router();

router.post('/orders/:orderId/review', verifyToken, authorize('CUSTOMER'), createReviewController);
router.get('/restaurants/:restaurantId/reviews', getRestaurantReviewsController); 

export default router;