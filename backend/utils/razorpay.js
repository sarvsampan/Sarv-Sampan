import crypto from 'crypto';
import razorpay from '../config/razorpay.js';

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in rupees (will be converted to paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {object} options - Additional options for order creation
 * @returns {Promise} Razorpay order object
 */
export const createRazorpayOrder = async (amount, currency = 'INR', options = {}) => {
  try {
    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: options.notes || {},
    };

    const order = await razorpay.orders.create(orderOptions);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    console.log('🔍 Verifying Razorpay signature...');
    console.log('Order ID:', orderId);
    console.log('Payment ID:', paymentId);
    console.log('Received Signature:', signature);

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    console.log('Generated Signature:', generatedSignature);
    console.log('Signatures Match:', generatedSignature === signature);

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
};

/**
 * Verify Razorpay webhook signature
 * @param {string} body - Raw webhook body
 * @param {string} signature - Razorpay webhook signature from headers
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = (body, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise} Payment details
 */
export const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in rupees (optional, full refund if not specified)
 * @returns {Promise} Refund object
 */
export const refundPayment = async (paymentId, amount = null) => {
  try {
    const refundOptions = {};
    if (amount !== null) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};
