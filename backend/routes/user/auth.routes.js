import express from 'express';
import { UserAuthController } from '../../controllers/user/auth.controller.js';
import { authenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', UserAuthController.signup);
router.post('/login', UserAuthController.login);

// Protected routes (require authentication)
router.get('/profile', authenticateUser, UserAuthController.getProfile);
router.put('/profile', authenticateUser, UserAuthController.updateProfile);
router.post('/change-password', authenticateUser, UserAuthController.changePassword);

export default router;
