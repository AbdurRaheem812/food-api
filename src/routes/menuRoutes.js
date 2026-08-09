import { Router } from 'express';
import {
  createCategoryController, getCategoriesController,
  createMenuItemController, getMenuController, updateMenuItemController,
  toggleAvailabilityController, uploadMenuItemImageController, deleteMenuItemController,
} from '../controllers/menuController.js';
import { verifyToken, authorize } from '../middleware/authentication.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Categories — nested under a restaurant
router.post('/restaurants/:restaurantId/categories', verifyToken, authorize('OWNER'), createCategoryController);
router.get('/restaurants/:restaurantId/categories', getCategoriesController); 

// Menu items — nested under a restaurant for create/list
router.post('/restaurants/:restaurantId/menu-items', verifyToken, authorize('OWNER'), createMenuItemController);
router.get('/restaurants/:restaurantId/menu-items', getMenuController); 

// Individual menu item actions — flat, by item id
router.patch('/menu-items/:id', verifyToken, authorize('OWNER'), updateMenuItemController);
router.patch('/menu-items/:id/toggle-available', verifyToken, authorize('OWNER'), toggleAvailabilityController);
router.post('/menu-items/:id/image', verifyToken, authorize('OWNER'), upload.single('image'), uploadMenuItemImageController);
router.delete('/menu-items/:id', verifyToken, authorize('OWNER'), deleteMenuItemController);

export default router;