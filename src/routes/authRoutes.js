import {Router} from 'express';
import { registerController, loginController, deleteUserController } from '../controllers/authController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.delete('/delete/:id', verifyToken, authorize("ADMIN"), deleteUserController);

export default router;