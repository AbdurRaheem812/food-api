import { Router } from 'express';
import { applyController, uploadLogoController, getMyRestaurantsController, updateRestaurantController, toggleOpenController, getPublicRestaurantsController, getPublicRestaurantByIdController } from '../controllers/restaurantController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/apply', verifyToken, authorize('OWNER'), applyController);
router.post('/:id/logo', verifyToken, authorize('OWNER'), upload.single('logo'), uploadLogoController);
router.put('/:id', verifyToken, authorize('OWNER'), updateRestaurantController);
router.patch('/:id/toggle-open', verifyToken, authorize('OWNER'), toggleOpenController);
router.get('/', getPublicRestaurantsController); 
router.get('/me/restaurants', verifyToken, authorize('OWNER'), getMyRestaurantsController);
router.get('/:id', getPublicRestaurantByIdController);

export default router;