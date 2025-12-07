import express from 'express';
import { UserReviewController } from '../../controllers/user/review.controller.js';
import { authenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/product/:productId', UserReviewController.getProductReviews);
router.get('/stats/:productId', UserReviewController.getReviewStats);

// Protected routes (auth required)
router.use(authenticateUser);

router.post('/', UserReviewController.createReview);
router.get('/my-reviews', UserReviewController.getMyReviews);
router.put('/:reviewId', UserReviewController.updateReview);
router.delete('/:reviewId', UserReviewController.deleteReview);
router.post('/:reviewId/helpful', UserReviewController.markHelpful);

export default router;
