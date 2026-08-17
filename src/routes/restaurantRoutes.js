import { Router } from 'express';
import { applyController, uploadLogoController } from '../controllers/restaurantController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/apply', verifyToken, authorize('OWNER'), applyController);
router.post('/logo', verifyToken, authorize('OWNER'), upload.single('logo'), uploadLogoController);

export default router;