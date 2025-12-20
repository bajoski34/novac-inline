// javascript
/**
 * API utilities for Novac Payment
 *
 * - Added createHeaders middleware to centralize headers
 * - Added request() wrapper to standardize fetch, parsing and errors
 * - Exported validateOtp to eliminate ESLint unused-var
 * - Cleaned up verifyPayment to await JSON parsing
 */

const NOVAC_API_BASE = 'https://api.novacpayment.com/api/v1';

/**
 * Middleware: create headers for requests
 */
export const createHeaders = (publicKey) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicKey || ''}`
});

/**
 * Unified response handler
 */
const handleResponse = async (res) => {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && data.message) || res.statusText || 'Request failed';
    throw new Error(msg);
  }

  return data;
};

/**
 * Request wrapper (acts as middleware)
 * @param {Object} opts
 * @param {string} opts.path - endpoint path starting with '/'
 * @param {string} [opts.method='GET'] - HTTP method
 * @param {Object} [opts.body] - request body for POST/PUT
 * @param {string} [opts.publicKey] - public key for Authorization header
 */
const request = async ({ path, method = 'GET', body, publicKey }) => {
  const init = {
    method,
    headers: createHeaders(publicKey)
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${NOVAC_API_BASE}${path}`, init);
  return handleResponse(res);
};

/* --- API helpers using the middleware --- */

export const initiatePaymentRequest = async (payload) => {
  // build body without leaking publicKey into payload body if present
  const { publicKey, ...body } = payload;
  return request({
    path: '/initiate',
    method: 'POST',
    body,
    publicKey
  });
};

export const validateOtp = async (payload) => {
  const { publicKey, reference, otp } = payload;
  return request({
    path: '/card/validate-otp',
    method: 'POST',
    body: { reference, otp },
    publicKey
  });
};

export const cardPaymentRequest = async (payload) => {
  const { publicKey, cardHolderName, cardNumber, cardPin, cvv, expiryMonth, expiryYear, transactionReference } = payload;
  return request({
    path: '/card-payment',
    method: 'POST',
    body: {
      transactionReference,
      cardHolderName,
      cardNumber,
      cardPin,
      cvv,
      expiryMonth,
      expiryYear
    },
    publicKey
  });
};

export const bankTransferRequest = async (payload) => {
  const { publicKey, reference } = payload;
  return request({
    path: '/bank-transfer',
    method: 'POST',
    body: {
      transactionReference: reference,
      paymentType: 'bank_transfer'
    },
    publicKey
  });
};

export const ussdPaymentRequest = async (payload) => {
  const { publicKey, bankCode, reference } = payload;
  return request({
    path: '/ussd-payment',
    method: 'POST',
    body: {
      transactionReference: reference,
      bankCode
    },
    publicKey
  });
};

export const getUssdBanks = async (publicKey) => {
  return request({ path: '/ussd-getbanks', method: 'GET', publicKey });
};

export const getTransactionFee = async (payload) => {
  const { publicKey, reference, paymentMethod } = payload;
  return request({
    path: '/transaction-fee',
    method: 'POST',
    body: {
      transactionReference: reference,
      paymentType: paymentMethod
    },
    publicKey
  });
};

/* --- High level flows --- */

export const makePaymentRequest = async (payload, initiateResponse) => {
  try {
    if (!payload.publicKey) throw new Error('Public key is required');
    if (!payload.email) throw new Error('Email is required');
    if (!payload.amount || payload.amount <= 0) throw new Error('Valid amount is required');

    // local simulator for test public keys
    if (payload.publicKey && payload.publicKey.includes('carl')) {
      await new Promise((r) => setTimeout(r, 1500));
      const responses = {
        card: {
          status: 'success',
          reference: payload.reference,
          transactionId: generateTransactionId(),
          message: 'Payment successful',
          amount: payload.amount,
          currency: payload.currency
        },
        bank_transfer: {
          status: 'pending',
          reference: payload.reference,
          accountNumber: '0123456789',
          accountName: 'Novac Payment Limited',
          bankName: 'Access Bank',
          message: 'Transfer details generated'
        },
        ussd: {
          status: 'pending',
          reference: payload.reference,
          paymentCode: Math.floor(100000 + Math.random() * 900000),
          message: 'USSD code generated'
        }
      };
      return responses[payload.paymentMethod] || responses.card;
    }

    let response;

    switch (payload.paymentMethod) {
      case 'bank_transfer': {
        const bankResponse = (await bankTransferRequest(payload)).data || {};
        response = {
          status: 'pending',
          reference: payload.reference,
          accountNumber: bankResponse.accountNumber || '0123456789',
          accountName: bankResponse.accountName || 'Novac Payment Limited',
          bankName: bankResponse.bankName || 'Access Bank',
          message: bankResponse.friendlyMessage || 'Transfer details generated'
        };
        break;
      }
      case 'ussd':
        response = await ussdPaymentRequest({
          publicKey: payload.publicKey,
          bankCode: payload.bankCode,
          reference: initiateResponse.data.transactionReference
        });
        break;
      case 'card':
        response = await cardPaymentRequest({
          publicKey: payload.publicKey,
          cardNumber: payload.cardDetails.cardNumber,
          cardPin: payload.cardDetails.cardPin,
          cvv: payload.cardDetails.cvv,
          expiryMonth: payload.cardDetails.expiryMonth,
          expiryYear: payload.cardDetails.expiryYear,
          cardHolderName: payload.cardDetails.cardholderName,
          transactionReference: initiateResponse.data.transactionReference
        });
        break;
      default:
        response = {
          link: initiateResponse.data.paymentRedirectUrl,
          reference: initiateResponse.data.transactionReference
        };
        break;
    }

    return response;
  } catch (error) {
    throw new Error(error.message || 'Network error. Please try again.');
  }
};

export const verifyPayment = async (reference, publicKey) => {
  try {
    const res = await request({
      path: `/checkout/${reference}/verify`,
      method: 'GET',
      publicKey
    });
    return res;
  } catch (error) {
    throw new Error(error.message || 'Verification failed');
  }
};

/* Utility */
export const generateTransactionId = () => `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

export default {
  makePaymentRequest,
  verifyPayment
};
