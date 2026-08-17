import {Router} from 'express';
import { registerController, loginController, refreshController, logoutController, deleteUserController, updateProfileController, deactivateAccountController, deleteAccountController } from '../controllers/authController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.patch('/me', verifyToken, updateProfileController);
router.delete('/delete/:id', verifyToken, authorize("ADMIN"), deleteUserController);
router.post('/me/deactivate', verifyToken, deactivateAccountController);
router.delete('/me', verifyToken, deleteAccountController);

export default router;