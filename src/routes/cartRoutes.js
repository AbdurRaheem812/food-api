import { Router } from 'express';
import { getCartController, addToCartController, updateCartItemController, removeCartItemController, clearCartController } from '../controllers/cartController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';

const router = Router();

router.get('/', verifyToken, authorize('CUSTOMER'), getCartController);
router.post('/items', verifyToken, authorize('CUSTOMER'), addToCartController);
router.patch('/items/:id', verifyToken, authorize('CUSTOMER'), updateCartItemController);
router.delete('/items/:id', verifyToken, authorize('CUSTOMER'), removeCartItemController);
router.delete('/', verifyToken, authorize('CUSTOMER'), clearCartController);

export default router;