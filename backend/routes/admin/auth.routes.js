import express from 'express';
import { AuthController } from '../../controllers/admin/auth.controller.js';
import { authenticate, adminOnly, superAdminOnly } from '../../middlewares/index.js';

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes (require authentication)
router.use(authenticate);
router.use(adminOnly);

router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.put('/change-password', AuthController.changePassword);
router.post('/logout', AuthController.logout);

// Super admin only routes
router.post('/create-admin', superAdminOnly, AuthController.createAdmin);

export default router;
