import { Router } from 'express';
import { createOrderController, getMyOrdersController, getOrderByIdController, updateOrderStatusController, getRestaurantOrdersController, getAllOwnerOrdersController } from '../controllers/orderController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';

const router = Router();

router.post('/', verifyToken, authorize('CUSTOMER'), createOrderController);

router.patch('/:id/status', verifyToken, authorize('CUSTOMER', 'OWNER'), updateOrderStatusController);
router.get('/me', verifyToken, authorize('CUSTOMER'), getMyOrdersController);
router.get('/:id', verifyToken, authorize('CUSTOMER', 'OWNER'), getOrderByIdController);
router.get('/restaurant/:restaurantId', verifyToken, authorize('OWNER'), getRestaurantOrdersController);
router.get('/owner/all', verifyToken, authorize('OWNER'), getAllOwnerOrdersController);

export default router;