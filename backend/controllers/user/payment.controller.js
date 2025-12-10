import { success } from '../../utils/response.js';
import supabase from '../../config/supabase.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  refundPayment
} from '../../utils/razorpay.js';

export class UserPaymentController {
  /**
   * POST /api/user/payments/create-order
   * Create a Razorpay order for payment
   */
  static async createPaymentOrder(req, res, next) {
    try {
      const { amount, orderId, orderNumber } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount'
        });
      }

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      // Verify order exists
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order is already paid
      if (order.payment_status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is already paid'
        });
      }

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(amount, 'INR', {
        receipt: orderNumber || order.order_number,
        notes: {
          order_id: orderId,
          order_number: order.order_number
        }
      });

      // Store Razorpay order ID in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          razorpay_order_id: razorpayOrder.id
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with Razorpay order ID:', updateError);
      }

      console.log('✅ Razorpay order created:', razorpayOrder.id);

      res.status(200).json(success({
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      }, 'Payment order created successfully'));

    } catch (err) {
      console.error('❌ Payment order creation error:', err);
      next(err);
    }
  }

  /**
   * POST /api/user/payments/verify
   * Verify Razorpay payment signature
   */
  static async verifyPayment(req, res, next) {
    try {
      console.log('📝 Payment verification request received');
      console.log('Request body:', req.body);

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        order_id
      } = req.body;

      // Validation
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.log('❌ Missing verification parameters');
        return res.status(400).json({
          success: false,
          message: 'Missing payment verification parameters'
        });
      }

      // Verify signature
      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        console.log('❌ Signature verification failed');
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      console.log('✅ Signature verified successfully');

      // Fetch payment details from Razorpay
      let paymentDetails;
      try {
        paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }

      // Update order in database
      const updateData = {
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        payment_method: 'razorpay',
        paid_at: new Date().toISOString()
      };

      // Add payment details if available
      if (paymentDetails) {
        updateData.payment_details = {
          method: paymentDetails.method,
          email: paymentDetails.email,
          contact: paymentDetails.contact,
          card_id: paymentDetails.card_id,
          bank: paymentDetails.bank,
          wallet: paymentDetails.wallet,
          vpa: paymentDetails.vpa
        };
      }

      const { data: order, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('razorpay_order_id', razorpay_order_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating order payment status:', updateError);
        throw updateError;
      }

      console.log('✅ Payment verified for order:', order.order_number);

      res.status(200).json(success({
        order_id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status
      }, 'Payment verified successfully'));

    } catch (err) {
      console.error('❌ Payment verification error:', err);
      next(err);
    }
  }

  /**
   * POST /api/user/payments/webhook
   * Handle Razorpay webhooks
   */
  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = verifyWebhookSignature(body, signature);

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      const event = req.body.event;
      const payload = req.body.payload.payment.entity;

      console.log('📨 Webhook received:', event);

      // Handle different webhook events
      switch (event) {
        case 'payment.authorized':
        case 'payment.captured':
          await handlePaymentSuccess(payload);
          break;

        case 'payment.failed':
          await handlePaymentFailed(payload);
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }

      res.status(200).json({ success: true });

    } catch (err) {
      console.error('❌ Webhook handling error:', err);
      res.status(500).json({ success: false });
    }
  }

  /**
   * POST /api/user/payments/refund
   * Initiate a refund for a payment
   */
  static async initiateRefund(req, res, next) {
    try {
      const { orderId, amount, reason } = req.body;

      // Validation
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      // Get order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order is paid
      if (order.payment_status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Order is not paid yet'
        });
      }

      if (!order.razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          message: 'No payment ID found for this order'
        });
      }

      // Process refund
      const refund = await refundPayment(
        order.razorpay_payment_id,
        amount || null // null means full refund
      );

      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          refund_id: refund.id,
          refund_amount: refund.amount / 100, // Convert paise to rupees
          refund_reason: reason || null,
          refunded_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order refund status:', updateError);
      }

      console.log('✅ Refund initiated for order:', order.order_number);

      res.status(200).json(success({
        refund_id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }, 'Refund initiated successfully'));

    } catch (err) {
      console.error('❌ Refund error:', err);
      next(err);
    }
  }
}

// Helper function to handle successful payment
async function handlePaymentSuccess(payload) {
  try {
    const { order_id, id: payment_id } = payload;

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: payment_id,
        paid_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id);

    if (error) {
      console.error('Error updating order on payment success:', error);
    } else {
      console.log('✅ Order payment status updated via webhook');
    }
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error);
  }
}

// Helper function to handle failed payment
async function handlePaymentFailed(payload) {
  try {
    const { order_id } = payload;

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed'
      })
      .eq('razorpay_order_id', order_id);

    if (error) {
      console.error('Error updating order on payment failure:', error);
    } else {
      console.log('⚠️ Order payment marked as failed via webhook');
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}

export default UserPaymentController;
