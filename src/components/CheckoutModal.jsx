import React, { useEffect, useState } from 'react';
import { generateTransactionId, initiatePaymentRequest, verifyPayment } from "../utils/api";
import { Toaster } from "react-hot-toast";

const CheckoutModal = ({ config, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialResponse, setInitialResponse] = useState(null);
  const [startVerifying, setStartVerifying] = useState(false);

  const tabs = [];
  
  if (config.paymentMethods.includes('card')) {
    tabs.push({ id: 'card', label: 'Card', icon: '💳' });
  }
  if (config.paymentMethods.includes('bank_transfer')) {
    tabs.push({ id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' });
  }
  if (config.paymentMethods.includes('ussd')) {
    tabs.push({ id: 'ussd', label: 'USSD', icon: '📱' });
  }

  // const handlePaymentSuccess = (response) => {
  //   setIsProcessing(false);
  //   if (config.redirectUrl) {
  //     handleRedirect()
  //   }
  //   config.onSuccess(response);
  //   setTimeout(() => onClose(), 1500);
  // };
  //
  // const handlePaymentError = (error) => {
  //   setIsProcessing(false);
  //   config.onError(error);
  // };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  const handleRedirect = (statusOverride) => {
    if(!config.redirectUrl) return;

    if (!config.redirectUrl.startsWith('https://') && config.redirectUrl.startsWith('http://')) {
      config.redirectUrl = config.redirectUrl.replace('http://', 'https://');

      const redirectOptions = new XMLHttpRequest();
      redirectOptions.open('OPTIONS', config.redirectUrl, false);
      redirectOptions.send();

      if (redirectOptions.status !== 200) {
        console.error('Invalid redirectUrl. Please check your configuration.');
        return;
      }
    }

    if (config.redirectUrl) {
      const txRef = initialResponse?.data?.transactionReference;
      const status = statusOverride || 'success';
      const url = new URL(config.redirectUrl);
      url.searchParams.set('transactionReference', txRef || '');
      url.searchParams.set('status', status);
      window.location.href = url.toString();
    }
  }

  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    const init = async () => {
      // Prevent multiple concurrent initialization requests
      if (hasInitialized) return;
      hasInitialized = true;

      try {
        const full_name = (config.customerName || '').split(' ');
        const initiateResponse = await initiatePaymentRequest({
          publicKey: config.publicKey,
          transactionReference: config.reference || generateTransactionId(),
          amount: config.amount,
          currency: config.currency,
          // redirectUrl: config.redirectUrl,
          checkoutCustomerData: {
            email: config.email,
            firstName: full_name[0] || 'Anonymous',
            lastName: full_name[1] || 'Anonymous',
            phoneNumber: config.customerPhone || ''
          },
          checkoutCustomizationData: {
            logoUrl: config.customization?.logoUrl || '',
            checkoutModalTitle: config.customization?.title || 'Novac Payment',
            paymentDescription: config.customization?.description || 'Complete your payment securely'
          }
        });

        if (isMounted) {
          setInitialResponse(initiateResponse);
        }
      } catch (error) {
        // Log error but don't fail silently
        console.error('Failed to initiate payment request:', error);
        if (isMounted) {
          config.onError?.(error);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [config.publicKey, config.reference, config.amount, config.currency, config.email, config.customerName, config.customerPhone, config.customization, config.onError]);

  useEffect(() => {
    if (!startVerifying || !initialResponse?.data?.transactionReference) return undefined;

    let cancelled = false;
    const txRef = initialResponse.data.transactionReference;

    const poll = async () => {
      try {
        const res = await verifyPayment(txRef, config.publicKey);
        if (cancelled) return;

        const status = (res?.data?.status || '').toLowerCase();
        if (!status || status === 'pending') return;

        // Stop polling and redirect with the final status
        cancelled = true;
        if (status === 'successful' && typeof config.onSuccess === 'function') {
          config.onSuccess(res);
        }
        if (status === 'failed' && typeof config.onError === 'function') {
          config.onError(new Error(res?.message || 'Payment failed'));
        }

        handleRedirect(status);
      } catch (err) {
        // keep polling on transient errors
        console.error('Verification polling error', err);
      }
    };

    const intervalId = setInterval(poll, 3000);
    poll();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [startVerifying, initialResponse, config.publicKey]);

  return (
    <div className="novac-iframe-overlay" onClick={handleOverlayClick}>
      <button className="novac-iframe-close-btn" onClick={onClose}>×</button>
      {initialResponse?.data?.paymentRedirectUrl ? (
        <iframe 
          src={initialResponse.data.paymentRedirectUrl} 
          className="novac-iframe"
          title="Novac Payment"
          onLoad={() => setStartVerifying(true)}
        />
      ) : (
        <div className="novac-iframe-loading">
          <div className="novac-iframe-spinner"></div>
          <p>Loading payment...</p>
        </div>
      )}
    </div>
  );
};

export default CheckoutModal;

