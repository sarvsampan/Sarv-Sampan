import express from 'express';
import { CustomerController } from '../../controllers/admin/customer.controller.js';

const router = express.Router();

router.get('/', CustomerController.getAllCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.patch('/:id/status', CustomerController.updateCustomerStatus);

export default router;
