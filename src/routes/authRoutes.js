import {Router} from 'express';
import { registerController, loginController, deleteUserController } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authentication.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.delete('/delete/:id', verifyToken, deleteUserController);

export default router;