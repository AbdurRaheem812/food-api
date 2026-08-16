import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';

const router = Router();
router.use(verifyToken, authorize('ADMIN'));

router.get('/applications', adminController.getPendingApplicationsController);
router.get('/users', adminController.getUsersController);
router.get('/stats', adminController.getPlatformStatsController);
router.patch('/users/:id/toggle-block', adminController.toggleUserBlockController);
router.patch('/reviews/:id/toggle-hide', adminController.hideReviewController);
router.patch('/applications/:id', adminController.decideApplicationController);

export default router;