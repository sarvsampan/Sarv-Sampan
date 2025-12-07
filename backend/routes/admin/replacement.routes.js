import express from 'express';
import ReplacementController from '../../controllers/admin/replacement.controller.js';

const router = express.Router();

// Get replacement stats (must be before /:id route)
router.get('/stats', ReplacementController.getReplacementStats);

// Get all replacements with filters
router.get('/', ReplacementController.getAllReplacements);

// Get replacement by ID
router.get('/:id', ReplacementController.getReplacementById);

// Create replacement
router.post('/', ReplacementController.createReplacement);

// Update replacement status
router.put('/:id/status', ReplacementController.updateReplacementStatus);

export default router;
